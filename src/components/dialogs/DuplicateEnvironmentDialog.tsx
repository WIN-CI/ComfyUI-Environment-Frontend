import { useEffect, useState } from 'react'
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
import FormFieldComponent from '../form/FormFieldComponent'
import MountConfigRow from '../form/MountConfigRow'

const defaultComfyUIPath = import.meta.env.VITE_DEFAULT_COMFYUI_PATH
const SUCCESS_TOAST_DURATION = 2000

const formSchema = z.object({
  name: z.string().min(1, { message: "Environment name is required" }).max(128, { message: "Environment name must be less than 128 characters" }),
  release: z.string().optional(),
  image: z.string().optional(),
  comfyUIPath: z.string().min(1, { message: "ComfyUI path is required" }),
  command: z.string().optional(),
  port: z.string().optional(),
  runtime: z.enum(["nvidia", "none"]),
  environmentType: z.enum(["Auto", "Custom"]),
  mountConfig: z.array(z.object({
    directory: z.string(),
    action: z.enum(["mount", "copy"])
  }))
})


export interface DuplicateEnvironmentDialogProps {
  environment: Environment
  environments: Environment[]
  duplicateEnvironmentHandler: (id: string, environment: EnvironmentInput) => Promise<void>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function DuplicateEnvironmentDialog({ environment, environments, duplicateEnvironmentHandler, open, onOpenChange }: DuplicateEnvironmentDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: environment.name + "-copy",
      release: environment.options?.["comfyui_release"] as string || "latest",
      image: "",
      comfyUIPath: environment.comfyui_path || defaultComfyUIPath || "",
      command: environment.command || "",
      port: environment.options?.["port"] as string || "8188",
      runtime: environment.options?.["runtime"] as "nvidia" | "none" || "nvidia",
      environmentType: "Auto",
      mountConfig: Object.entries(environment.options?.["mount_config"] || {})
        .filter(([_, action]) => action === "mount")
        .map(([directory, action]) => ({ directory, action: action as "mount" })),
    },
  })

  // Use useEffect to update form values when the environment changes
  useEffect(() => {
    form.reset();
  }, [open]);

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
      image: "", // TODO: Image not needed for duplicate
      command: values.command,
      comfyui_path: values.comfyUIPath,
      options: {
        "comfyui_release": values.release,
        "port": values.port,
        "mount_config": Object.fromEntries(values.mountConfig.map(({ directory, action }) => [directory, action])),
        "runtime": values.runtime,
      }
    }

    try {
      // validateEnvironmentInput(newEnvironment)
      console.log(newEnvironment)

      // Start loading state
      setIsLoading(true)

      // Create the environment
      await duplicateEnvironmentHandler(environment.id || "", newEnvironment)

      // Stop loading state
      setIsLoading(false)

      onOpenChange(false)
      resetForm()
      toast({
        title: "Success",
        description: "Environment created successfully",
        duration: SUCCESS_TOAST_DURATION,
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
    form.setValue("environmentType", value as "Auto" | "Custom");
    const prev_mount_config = environment.options?.["mount_config"] || {};

    if (value === "Auto") {
      const filteredMountConfig = Object.entries(prev_mount_config)
        .filter(([_, action]) => action === "mount")
        .map(([directory, action]) => ({ directory, action }));

      form.setValue("mountConfig", filteredMountConfig as { directory: string; action: "mount" | "copy" }[]);
    }
    else {
      form.setValue("mountConfig", Object.entries(prev_mount_config)
        .map(([directory, action]) => ({ directory, action })) as { directory: string; action: "mount" | "copy" }[]);
    }
  }

  const handleMountConfigChange = () => {
    form.setValue("environmentType", "Custom")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[80vh] overflow-y-auto dialog-content'>
        <DialogHeader>
          <DialogTitle>Duplicate Environment</DialogTitle>
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
                          <SelectValue>
                            {field.value}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Auto">
                          <div className="flex flex-col">
                            <span className="font-medium">Auto</span>
                            <span className="text-xs text-muted-foreground">Keeps the same mount configuration as the<br /> original environment, excluding copied directories.</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Custom">
                          <div className="flex flex-col">
                            <span className="font-medium">Custom</span>
                            <span className="text-xs text-muted-foreground">Allows for advanced configuration options.</span>
                          </div>
                        </SelectItem>

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
                                <SelectItem value="nvidia">Nvidia</SelectItem>
                                <SelectItem value="none">None</SelectItem>
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

