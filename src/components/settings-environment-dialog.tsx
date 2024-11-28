import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Environment } from '@/types/Environment'
import { useToast } from "@/hooks/use-toast"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Loader2 } from 'lucide-react'

const formSchema = z.object({
  name: z.string().min(1, { message: "Environment name is required" }),
})

export interface SettingsEnvironmentDialogProps {
  children: React.ReactNode
  environment: Environment
  updateEnvironmentHandler: (id: string, name: string) => Promise<void>
}

export default function SettingsEnvironmentDialog({ children, environment, updateEnvironmentHandler }: SettingsEnvironmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: environment.name,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      await updateEnvironmentHandler(environment.id || "", values.name)
      setIsOpen(false)
      toast({
        title: "Success",
        description: "Environment updated successfully",
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className='max-h-[80vh] min-w-[700px] overflow-y-auto dialog-content'>
        <DialogHeader>
          <DialogTitle>Environment Settings</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">About</h3>
              <div className="space-y-1">
                <p><strong>Base Image:</strong> {environment.metadata?.["base_image"] as string}</p>
                <p><strong>Duplicate:</strong> {environment.duplicate ? 'Yes' : 'No'}</p>
                <p><strong>Environment ID:</strong> {environment.id}</p>
                <p><strong>ComfyUI Path:</strong> {environment.comfyui_path}</p>
                <p><strong>Command:</strong> {environment.command || 'N/A'}</p>
                <p><strong>ComfyUI Release:</strong> {environment.options?.["comfyui_release"] as string}</p>
                <p><strong>Port:</strong> {environment.options?.["port"] as string}</p>
                <p><strong>Mount Config:</strong></p>
                <ul className="list-disc list-inside pl-4">
                  {Object.entries(environment.options?.["mount_config"] as Record<string, string> || {}).map(([key, value]) => (
                    <li key={key}>{key}: {value}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

