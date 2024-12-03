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
import { Loader2, Calendar, Image, Copy, Hash, Folder, Terminal, Tag, Network, HardDrive } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <InfoItem icon={<Calendar className="h-4 w-4" />} label="Created At" value={new Date(Number(environment.metadata?.["created_at"]) * 1000).toLocaleString()} />
                  <InfoItem icon={<Image className="h-4 w-4" />} label="Base Image" value={environment.metadata?.["base_image"] as string} />
                  <InfoItem icon={<Copy className="h-4 w-4" />} label="Duplicate" value={environment.duplicate ? 'Yes' : 'No'} />
                  <InfoItem icon={<Hash className="h-4 w-4" />} label="Environment ID" value={environment.id || 'N/A'} />
                  <InfoItem icon={<Folder className="h-4 w-4" />} label="ComfyUI Path" value={environment.comfyui_path || 'N/A'} />
                  <InfoItem icon={<Terminal className="h-4 w-4" />} label="Command" value={environment.command || 'N/A'} />
                  <InfoItem icon={<Tag className="h-4 w-4" />} label="ComfyUI Release" value={environment.options?.["comfyui_release"] as string} />
                  <InfoItem icon={<Network className="h-4 w-4" />} label="Port" value={environment.options?.["port"] as string} />
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <HardDrive className="h-4 w-4 mr-2" />
                    Mount Config
                  </h4>
                  <ul className="grid grid-cols-2 gap-2">
                    {Object.entries(environment.options?.["mount_config"] as Record<string, string> || {}).map(([key, value]) => (
                      <li key={key} className="text-sm">
                        <span className="font-medium">{key}:</span> {value}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
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

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center space-x-2">
      {icon}
      <span className="text-sm">
        <span className="font-medium">{label}:</span> {value}
      </span>
    </div>
  )
}

