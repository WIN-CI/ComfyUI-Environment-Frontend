import { useState, useEffect } from 'react'
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
import { tryInstallComfyUI } from '@/api/environmentApi'
import { CustomAlertDialog } from './CustomAlertDialog'
import FormFieldComponent from '../form/FormFieldComponent'
import MountConfigRow from '../form/MountConfigRow'
import { UserSettings } from '@/types/UserSettings'

const defaultComfyUIPath = import.meta.env.VITE_DEFAULT_COMFYUI_PATH

const dockerImageToReleaseMap = {
  "latest": "comfyui:v0.3.4-base-cuda12.6.2-pytorch2.5.1",
  "v0.3.4": "comfyui:v0.3.4-base-cuda12.6.2-pytorch2.5.1",
  "v0.3.0": "comfyui:v0.3.0-base-cuda12.6.2-pytorch2.5.1",
  "v0.2.7": "comfyui:v0.2.7-base-cuda12.6.2-pytorch2.5.1",
  "v0.2.6": "comfyui:v0.2.6-base-cuda12.6.2-pytorch2.5.1",
  "v0.2.5": "comfyui:v0.2.5-base-cuda12.6.2-pytorch2.5.1",
}

// Get the inverse mapping of dockerImageToReleaseMap
const comfyUIReleasesFromImageMap = Object.fromEntries(Object.entries(dockerImageToReleaseMap).map(([release, image]) => [image, release]))

const formSchema = z.object({
  name: z.string().min(1, { message: "Environment name is required" }),
  release: z.enum(Object.keys(dockerImageToReleaseMap) as [string, ...string[]]),
  image: z.string().optional(),
  comfyUIPath: z.string().min(1, { message: "ComfyUI path is required" }),
  environmentType: z.enum(["Default", "Default+", "Basic", "Isolated", "Custom"]),
  copyCustomNodes: z.boolean().default(false),
  command: z.string().optional(),
  port: z.string().optional(),
  runtime: z.enum(["nvidia", "none"]),
  mountConfig: z.array(z.object({
    directory: z.string(),
    action: z.enum(["mount", "copy"])
  }))
})


export interface CreateEnvironmentDialogProps {
  children: React.ReactNode
  userSettings: UserSettings | null
  environments: Environment[]
  createEnvironmentHandler: (environment: EnvironmentInput) => Promise<void>
}

export default function CreateEnvironmentDialog({ children, userSettings, environments, createEnvironmentHandler }: CreateEnvironmentDialogProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [installComfyUIDialog, setInstallComfyUIDialog] = useState(false)
  const [isInstallingComfyUILoading, setIsInstallingComfyUILoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      release: "latest",
      image: "",
      comfyUIPath: userSettings?.comfyui_path || defaultComfyUIPath || "",
      environmentType: "Default",
      copyCustomNodes: false,
      command: userSettings?.command || "",
      port: String(userSettings?.port) || "8188",
      runtime: String(userSettings?.runtime) as "nvidia" | "none" || "nvidia",
      mountConfig: [
        { directory: "user", action: "mount" },
        { directory: "models", action: "mount" },
        { directory: "output", action: "mount" },
        { directory: "input", action: "mount" },
      ]
    },
  })

  useEffect(() => {
    form.reset({
      name: "",
      release: "latest",
      image: "",
      comfyUIPath: userSettings?.comfyui_path || defaultComfyUIPath || "",
      environmentType: "Default",
      copyCustomNodes: false,
      command: userSettings?.command || "",
      port: String(userSettings?.port) || "8188",
      runtime: String(userSettings?.runtime) as "nvidia" | "none" || "nvidia",
      mountConfig: [
        { directory: "user", action: "mount" },
        { directory: "models", action: "mount" },
        { directory: "output", action: "mount" },
        { directory: "input", action: "mount" },
      ]
    })
  }, [userSettings, form])

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
        "mount_config": Object.fromEntries(values.mountConfig.map(({ directory, action }) => [directory, action])),
        "runtime": values.runtime,
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
      console.log(error.message)
      if (error.message === "No valid ComfyUI installation found.") {
        setInstallComfyUIDialog(true)
      } else {
        console.error(error)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnvironmentTypeChange = (value: string) => {
    form.setValue("environmentType", value as "Default" | "Default+" | "Basic" | "Isolated" | "Custom")
    switch (value) {
      case "Default":
        form.setValue("mountConfig", [
          { directory: "user", action: "mount" },
          { directory: "models", action: "mount" },
          { directory: "output", action: "mount" },
          { directory: "input", action: "mount" },
        ])
        break
      case "Default+":
        form.setValue("mountConfig", [
          { directory: "custom_nodes", action: "copy" },
          { directory: "user", action: "mount" },
          { directory: "models", action: "mount" },
          { directory: "output", action: "mount" },
          { directory: "input", action: "mount" },
        ])
        break
      case "Basic":
        form.setValue("mountConfig", [
          { directory: "models", action: "mount" },
          { directory: "output", action: "mount" },
          { directory: "input", action: "mount" },
        ])
        break
      case "Isolated":
        form.setValue("mountConfig", [])
        break
    }
  }

  const handleMountConfigChange = () => {
    form.setValue("environmentType", "Custom")
  }

  const handleInstallComfyUI = async () => {
    try {
      console.log(form.getValues("comfyUIPath"))
      let branch = comfyUIReleasesFromImageMap[form.getValues("image") as keyof typeof comfyUIReleasesFromImageMap]
      setIsInstallingComfyUILoading(true)
      // If branch is latest, we don't need to specify a branch
      if (branch === "latest") {
        await tryInstallComfyUI(form.getValues("comfyUIPath"))
      } else {
        await tryInstallComfyUI(form.getValues("comfyUIPath"), branch)
      }
      // On success, append "ComfyUI" to the comfyui path TODO: This is a hack to make sure the path is correct
      const currentPath = form.getValues("comfyUIPath");
      const separator = currentPath.includes("\\") ? "\\" : "/";
      const newPath = currentPath.endsWith(separator) ? currentPath : currentPath + separator;
      form.setValue("comfyUIPath", newPath + "ComfyUI");
      toast({
        title: "Success",
        description: "ComfyUI installed successfully",
      })
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsInstallingComfyUILoading(false)
      setInstallComfyUIDialog(false)
    }
  }

  return (
    <>

      <CustomAlertDialog
        open={installComfyUIDialog}
        title="Could not find valid ComfyUI installation"
        description="We could not find a valid ComfyUI installation at the path you provided. Should we try to install ComfyUI automatically?"
        cancelText="No"
        actionText="Yes"
        onAction={handleInstallComfyUI}
        variant="default"
        loading={isInstallingComfyUILoading}
        />

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-h-[80vh] overflow-y-auto dialog-content">
          <DialogHeader>
            <DialogTitle>Create New Environment</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />{" "}
                  Creating...
                </div>
              )}
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormFieldComponent
                  control={form.control}
                  name="name"
                  label="Name"
                  placeholder=""
                />
                <FormField
                  control={form.control}
                  name="release"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">
                        ComfyUI Release
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl className="col-span-3">
                          <SelectTrigger>
                            <SelectValue placeholder="Select a release" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.keys(dockerImageToReleaseMap).map(
                            (release) => (
                              <SelectItem key={release} value={release}>
                                {release}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage className="col-start-2 col-span-3" />
                    </FormItem>
                  )}
                />
                <FormFieldComponent
                  control={form.control}
                  name="dockerImage"
                  label="Custom Docker Image"
                  placeholder="Optional: DockerHub image URL"
                />
                <FormFieldComponent
                  control={form.control}
                  name="comfyUIPath"
                  label="Path to ComfyUI"
                  placeholder="/path/to/ComfyUI"
                />
                <FormField
                  control={form.control}
                  name="environmentType"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">
                        Environment Type
                      </FormLabel>
                      <Select
                        onValueChange={handleEnvironmentTypeChange}
                        value={field.value}
                      >
                        <FormControl className="col-span-3">
                          <SelectTrigger>
                            <SelectValue>
                              {field.value}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Default">
                            <div className="flex flex-col">
                              <span className="font-medium">Default</span>
                              <span className="text-xs text-muted-foreground">Mounts workflows, models, output, and input<br /> directories from your local ComfyUI installation.</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Default+">
                            <div className="flex flex-col">
                              <span className="font-medium">Default+</span>
                              <span className="text-xs text-muted-foreground">Same as default, but also copies and installs custom<br /> nodes from your local ComfyUI installation.</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Basic">
                            <div className="flex flex-col">
                              <span className="font-medium">Basic</span>
                              <span className="text-xs text-muted-foreground">Same as default, but without mounting workflows.</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Isolated">
                            <div className="flex flex-col">
                              <span className="font-medium">Isolated</span>
                              <span className="text-xs text-muted-foreground">Creates an isolated environment with no mounts.</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Custom">
                            <div className="flex flex-col">
                              <span className="font-medium">Custom</span>
                              <span className="text-xs text-muted-foreground">Allows for advanced configuration options</span>
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
                    <AccordionTrigger className="text-md font-semibold py-2 px-2">
                      Advanced Options
                    </AccordionTrigger>
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
                              <FormLabel className="text-right">
                                Runtime
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
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
                        <FormFieldComponent
                          control={form.control}
                          name="command"
                          label="Command"
                          placeholder="Additional command"
                        />
                        <FormFieldComponent
                          control={form.control}
                          name="port"
                          label="Port"
                          placeholder="Port number"
                          type="number"
                        />
                        <div>
                          <FormLabel>Mount Config</FormLabel>
                          <div className="space-y-2 pt-2 rounded-lg">
                            {fields.map((field, index) => (
                              <MountConfigRow
                                key={field.id}
                                index={index}
                                remove={remove}
                                control={form.control}
                                onActionChange={handleMountConfigChange}
                              />
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                append({ directory: "", action: "mount" });
                                handleMountConfigChange();
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
                      "Create"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

