import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Environment, EnvironmentInput } from '@/types/Environment'
import { Switch } from '@/components/ui/switch'
import { useToast } from "@/hooks/use-toast"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Loader2, X } from 'lucide-react'

const defaultComfyUIPath = import.meta.env.VITE_DEFAULT_COMFYUI_PATH

const dockerImageToReleaseMap = {
  "latest": "comfyui-v0.3.4-base-cuda12.6.2-pytorch2.5.1:latest",
  "v0.3.4": "comfyui-v0.3.4-base-cuda12.6.2-pytorch2.5.1:latest",
  "v0.3.0": "comfyui-v0.3.0-base-cuda12.6.2-pytorch2.5.1:latest",
  "v0.2.7": "comfyui-v0.2.7-base-cuda12.6.2-pytorch2.5.1:latest",
  "v0.2.6": "comfyui-v0.2.6-base-cuda12.6.2-pytorch2.5.1:latest",
  "v0.2.5": "comfyui-v0.2.5-base-cuda12.6.2-pytorch2.5.1:latest",
}

const formSchema = z.object({
  name: z.string().min(1, { message: "Environment name is required" }),
  release: z.enum(Object.keys(dockerImageToReleaseMap) as [string, ...string[]]),
  image: z.string().optional(),
  comfyUIPath: z.string().min(1, { message: "ComfyUI path is required" }),
  environmentType: z.enum(["Default", "Isolated", "Custom"]),
  copyCustomNodes: z.boolean().default(false),
  command: z.string().optional(),
  port: z.string().optional(),
  runtime: z.enum(["nvidia", "cpu"]),
  mountConfig: z.array(z.object({
    directory: z.string(),
    action: z.enum(["mount", "copy"])
  }))
})

// Reusable FormFieldComponent
const FormFieldComponent = ({ control, name, label, placeholder, type = "text", children }: any) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem className="grid grid-cols-4 items-center gap-4">
        <FormLabel className="text-right">{label}</FormLabel>
        <FormControl className="col-span-3">
          {children || <Input {...field} type={type} placeholder={placeholder} />}
        </FormControl>
        <FormMessage className="col-start-2 col-span-3" />
      </FormItem>
    )}
  />
);

const MountConfigRow = ({ index, remove, control, onActionChange }: any) => (
  <div className="flex items-center space-x-2 mb-2">
    <div className="w-full">
    <FormField
      control={control}
      name={`mountConfig.${index}.directory`}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input {...field} placeholder="Directory name" onChange={(e) => {
              field.onChange(e)
              onActionChange()
            }} />
          </FormControl>
        </FormItem>
      )}
    />
    </div>
    <div className="w-40">
      <FormField
        control={control}
        name={`mountConfig.${index}.action`}
        render={({ field }) => (
          <FormItem>
            <Select onValueChange={(value) => {
              field.onChange(value)
              onActionChange()
            }} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="mount">Mount</SelectItem>
                <SelectItem value="copy">Copy</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
          
        )}
      />
    </div>  
    <Button type="button" variant="ghost" onClick={() => {
      remove(index)
      onActionChange()
    }}>
      <X className="h-4 w-4" />
    </Button>
  </div>
)

export interface CreateEnvironmentDialogProps {
  children: React.ReactNode
  environments: Environment[]
  createEnvironmentHandler: (environment: EnvironmentInput) => Promise<void>
}

export default function CreateEnvironmentDialog({ children, environments, createEnvironmentHandler }: CreateEnvironmentDialogProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      release: "latest",
      image: "",
      comfyUIPath: defaultComfyUIPath || "",
      environmentType: "Default",
      copyCustomNodes: false,
      command: "",
      port: "8188",
      runtime: "nvidia",
      mountConfig: [
        { directory: "custom_nodes", action: "copy" },
        { directory: "user", action: "mount" },
        { directory: "models", action: "mount" },
        { directory: "output", action: "mount" },
        { directory: "input", action: "mount" },
      ]
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "mountConfig",
  })

  const resetForm = () => {
    form.reset()
  }

  const validateEnvironmentInput = (environment: EnvironmentInput) => {
    const existingEnvironment = environments.find((env) => env.name === environment.name)
    if (existingEnvironment) {
      throw new Error("Environment name already taken")
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const newEnvironment: EnvironmentInput = {
      name: values.name,
      image: values.image || dockerImageToReleaseMap[values.release as keyof typeof dockerImageToReleaseMap],
      command: values.command,
      comfyui_path: values.comfyUIPath,
      options: {
        "comfyui_release": values.release,
        "port": values.port,
        "mount_config": JSON.stringify(Object.fromEntries(values.mountConfig.map(({ directory, action }) => [directory, action])))
      }
    }

    try {
      validateEnvironmentInput(newEnvironment)
      console.log(newEnvironment)

      // Start loading state
      setIsLoading(true)

      // Create the environment
      await createEnvironmentHandler(newEnvironment)

      // Stop loading state
      setIsLoading(false)

      setIsCreateModalOpen(false)
      resetForm()
      toast({
        title: "Success",
        description: "Environment created successfully",
      })
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnvironmentTypeChange = (value: string) => {
    form.setValue("environmentType", value as "Default" | "Isolated" | "Custom")
    if (value === "Default") {
      form.setValue("mountConfig", [
        { directory: "custom_nodes", action: "copy" },
        { directory: "user", action: "mount" },
        { directory: "models", action: "mount" },
        { directory: "output", action: "mount" },
        { directory: "input", action: "mount" },
      ])
    } else if (value === "Isolated") {
      form.setValue("mountConfig", [])
    }
  }

  const handleMountConfigChange = () => {
    form.setValue("environmentType", "Custom")
  }

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className='max-h-[80vh] overflow-y-auto dialog-content'>
        <DialogHeader>
          <DialogTitle>Create New Environment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" /> Creating...
              </div>
            )}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormFieldComponent control={form.control} name="name" label="Name" placeholder="" />
              <FormField
                control={form.control}
                name="release"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">ComfyUI Release</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl className="col-span-3">
                        <SelectTrigger>
                          <SelectValue placeholder="Select a release" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.keys(dockerImageToReleaseMap).map((release) => (
                          <SelectItem key={release} value={release}>{release}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="col-start-2 col-span-3" />
                  </FormItem>
                )}
              />
              <FormFieldComponent control={form.control} name="dockerImage" label="Custom Docker Image" placeholder="Optional: DockerHub image URL" />
              <FormFieldComponent control={form.control} name="comfyUIPath" label="Path to ComfyUI" placeholder="/path/to/ComfyUI" />
              <FormField
                control={form.control}
                name="environmentType"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Environment Type</FormLabel>
                    <Select onValueChange={handleEnvironmentTypeChange} value={field.value}>
                      <FormControl className="col-span-3">
                        <SelectTrigger>
                          <SelectValue placeholder="Select environment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Default">Default</SelectItem>
                        <SelectItem value="Isolated">Isolated</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="col-start-2 col-span-3" />
                  </FormItem>
                )}
              />
              <Accordion type="single" collapsible className="w-full px-1">
                <AccordionItem value="advanced-options">
                  <AccordionTrigger className="text-md font-semibold py-2 px-2">Advanced Options</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 px-4">
                      {/* <FormField
                        control={form.control}
                        name="copyCustomNodes"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Copy Custom Nodes From Local
                              </FormLabel>
                              <FormDescription>
                                This will copy custom nodes from your local ComfyUI installation
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      /> */}
                      <FormField
                        control={form.control}
                        name="runtime"
                        render={({ field }) => (
                          <FormItem className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right">Runtime</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl className="col-span-3">
                                <SelectTrigger>
                                  <SelectValue placeholder="Select runtime" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="nvidia">NVIDIA GPU</SelectItem>
                                <SelectItem value="cpu">CPU Only</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="col-start-2 col-span-3" />
                          </FormItem>
                        )}
                      />
                      <FormFieldComponent control={form.control} name="command" label="Command" placeholder="Additional command" />
                      <FormFieldComponent control={form.control} name="port" label="Port" placeholder="Port number" type="number" />
                      <div>
                        <FormLabel>Mount Config</FormLabel>
                        <div className="space-y-2 pt-2 rounded-lg">
                          {fields.map((field, index) => (
                            <MountConfigRow key={field.id} index={index} remove={remove} control={form.control} onActionChange={handleMountConfigChange} />
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              append({ directory: "", action: "mount" })
                              handleMountConfigChange()
                            }}
                          >
                            Add Directory
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

