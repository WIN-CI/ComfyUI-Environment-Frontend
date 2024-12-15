import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { checkImageExists, checkValidComfyUIPath, getComfyUIImageTags, pullImageStream, tryInstallComfyUI } from '@/api/environmentApi'
import { CustomAlertDialog } from './CustomAlertDialog'
import FormFieldComponent from '../form/FormFieldComponent'
import MountConfigRow from '../form/MountConfigRow'
import { UserSettings } from '@/types/UserSettings'
import { Progress } from '../ui/progress'
import ImagePullDialog from './PullImageDialog'

const defaultComfyUIPath = import.meta.env.VITE_DEFAULT_COMFYUI_PATH

const COMFYUI_IMAGE_NAME = "akatzai/comfyui-env"
const SUCCESS_TOAST_DURATION = 2000

// Get the inverse mapping of dockerImageToReleaseMap
// const comfyUIReleasesFromImageMap = Object.fromEntries(Object.entries(dockerImageToReleaseMap).map(([release, image]) => [image, release]))

const getLatestComfyUIReleaseFromBranch = (branch: string, releases: string[]) => {
  if (branch === "latest") {
    const filteredReleases = releases.filter(release => release !== "latest");
    return filteredReleases[0] || "latest"; // fallback to latest if none found
  }
  return branch;
}

const formSchema = z.object({
  name: z.string().min(1, { message: "Environment name is required" }).max(128, { message: "Environment name must be less than 128 characters" }),
  release: z.string().min(1, { message: "Release is required" }),
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
  const [releaseOptions, setReleaseOptions] = useState<string[]>(["latest"])
  const [pullImageDialog, setPullImageDialog] = useState(false)
  const [pendingEnvironment, setPendingEnvironment] = useState<EnvironmentInput | null>(null);
  
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
    if (isCreateModalOpen) {
      getComfyUIImageTags().then((result) => {
        console.log(result.tags)
        // Convert tags from object to array and add "latest" to the beginning
        const tagsArray = Object.values(result.tags).map(tag => String(tag));
        const filteredTags = tagsArray.filter(tag => tag !== "latest");
        setReleaseOptions(["latest", ...filteredTags]);
        console.log(Object.values(result.tags).map(tag => String(tag)))
      }).catch((error) => {
        console.error(error)
      })
    }
  }, [isCreateModalOpen])

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
    console.log(`onSubmit: ${JSON.stringify(values)}`)
    let release = getLatestComfyUIReleaseFromBranch(values.release, releaseOptions)
    console.log(release)
    const newEnvironment: EnvironmentInput = {
      name: values.name,
      image: values.image || `${COMFYUI_IMAGE_NAME}:${release}`,
      command: values.command,
      comfyui_path: values.comfyUIPath,
      options: {
        "comfyui_release": release,
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

      setPendingEnvironment(newEnvironment)
      await continueCreateEnvironment(newEnvironment)
    } catch (error: any) {
      console.log(error.message)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const continueCreateEnvironment = async (environment: EnvironmentInput | null) => {
    if (!environment) return;
    try {
      const validComfyUIPath = await checkValidComfyUIPath(environment.comfyui_path || "");
      if (!validComfyUIPath) {
        setInstallComfyUIDialog(true);
        setIsLoading(false);
        return; // Early return, no cleanup here
      }
  
      const imageExists = await checkImageExists(environment.image);
      if (!imageExists) {
        setPullImageDialog(true);
        setIsLoading(false);
        return; // Early return, no cleanup here
      }
  
      // Create environment
      await createEnvironmentHandler(environment);
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Environment created successfully",
        duration: SUCCESS_TOAST_DURATION,
      });
  
      // Cleanup after success
      setIsLoading(false);
      setPendingEnvironment(null);
    } catch (error: any) {
      // Handle error
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      setPendingEnvironment(null);
    }
  };

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
      let branch = form.getValues("release")
      branch = getLatestComfyUIReleaseFromBranch(branch, releaseOptions)
      console.log(branch)
      setIsInstallingComfyUILoading(true)

      await tryInstallComfyUI(form.getValues("comfyUIPath"), branch)

      setInstallComfyUIDialog(false);
      setIsInstallingComfyUILoading(false);
      setIsLoading(true);
      toast({
        title: "Success",
        description: "ComfyUI installed successfully",
        duration: SUCCESS_TOAST_DURATION,
      })
      await continueCreateEnvironment(pendingEnvironment);
      // On success, append "ComfyUI" to the comfyui path TODO: This is a hack to make sure the path is correct
      // const currentPath = form.getValues("comfyUIPath");
      // const separator = currentPath.includes("\\") ? "\\" : "/";
      // const newPath = currentPath.endsWith(separator) ? currentPath : currentPath + separator;
      // form.setValue("comfyUIPath", newPath + "ComfyUI");
      
    } catch (error: any) {
      setIsInstallingComfyUILoading(false);
      setInstallComfyUIDialog(false);
      setPendingEnvironment(null);
      setIsLoading(false);
      console.error(error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
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
        onCancel={() => setInstallComfyUIDialog(false)}
        variant="default"
        loading={isInstallingComfyUILoading}
      />

      <ImagePullDialog
        image={pendingEnvironment?.image || ""}
        open={pullImageDialog}
        onOpenChange={(open) => {
          setPullImageDialog(open);
          if (!open) {
            setPendingEnvironment(null);
            setIsLoading(false);
          }
        }}
        onSuccess={async () => {
          setPullImageDialog(false);
          setIsLoading(true);
          await continueCreateEnvironment(pendingEnvironment);
        }}
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
                          {releaseOptions.map(
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
                  name="image"
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

