import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { Loader2 } from 'lucide-react'

const defaultComfyUIPath = import.meta.env.VITE_DEFAULT_COMFYUI_PATH

const formSchema = z.object({
  name: z.string().min(1, { message: "Environment name is required" }),
  comfyUIPath: z.string().min(1, { message: "ComfyUI path is required" }),
  command: z.string().optional(),
  port: z.string().optional(),
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

export interface DuplicateEnvironmentDialogProps {
  children: React.ReactNode
  environment: Environment
  environments: Environment[]
  duplicateEnvironmentHandler: (id: string, environment: EnvironmentInput) => Promise<Response>
}

export default function DuplicateEnvironmentDialog({ children, environment, environments, duplicateEnvironmentHandler }: DuplicateEnvironmentDialogProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: environment.name + "-copy",
      comfyUIPath: environment.comfyui_path || defaultComfyUIPath,
      command: environment.command || "",
      port: String(environment.options?.port) || "8188",
    },
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
      image: "",
      command: values.command,
      comfyui_path: values.comfyUIPath,
      options: {
        "port": values.port,
      }
    }

    try {
      validateEnvironmentInput(newEnvironment)
      console.log(newEnvironment)

      // Start loading state
      setIsLoading(true)

      // Create the environment
      await duplicateEnvironmentHandler(environment.id || "", newEnvironment)

      // Stop loading state
      setIsLoading(false)

      setIsModalOpen(false)
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

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate Environment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" /> Duplicating...
              </div>
            )}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormFieldComponent control={form.control} name="name" label="Name" placeholder="" />
              <FormFieldComponent control={form.control} name="comfyUIPath" label="Path to ComfyUI" placeholder="/path/to/ComfyUI" />
              <Accordion type="single" collapsible className="w-full px-1">
                <AccordionItem value="advanced-options">
                  <AccordionTrigger className="text-md font-semibold py-2 px-5">Advanced Options</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 px-4">
                      <FormFieldComponent control={form.control} name="command" label="Command" placeholder="Additional command" />
                      <FormFieldComponent control={form.control} name="port" label="Port" placeholder="Port number" type="number" />
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

