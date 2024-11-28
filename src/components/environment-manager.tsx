import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Fan, Pencil, Copy, Trash2, Play, CloudUpload, Loader2, Settings, SquareTerminal } from 'lucide-react'
import { Environment, EnvironmentInput } from '@/types/Environment'
import CreateEnvironmentDialog from './create-environment-dialog'
import { useToast } from '@/hooks/use-toast'
import { StatusBadge } from './status-badge'
import { 
  createEnvironment, 
  fetchEnvironments, 
  activateEnvironment, 
  deactivateEnvironment, 
  duplicateEnvironment, 
  deleteEnvironment,
  updateEnvironment
} from '@/api/environmentApi'
import DuplicateEnvironmentDialog from './duplicate-environment-dialog'
import SettingsEnvironmentDialog from './settings-environment-dialog'
import LogDisplayDialog from './log-display-dialog'
import { CustomAlertDialog } from './custom-alert-dialog'

export function EnvironmentManagerComponent() {
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [activatingEnvironment, setActivatingEnvironment] = useState<string | null>(null)
  const [deletingEnvironment, setDeletingEnvironment] = useState<string | null>(null)
  const { toast } = useToast()

  const updateEnvironments = async () => {
    const fetchedEnvironments = await fetchEnvironments()
    setEnvironments(fetchedEnvironments)
  }

  const createEnvironmentHandler = async (environment: EnvironmentInput) => {
    try {
      // Wait for 5 seconds
      // await new Promise(resolve => setTimeout(resolve, 5000))
      await createEnvironment(environment)
      await updateEnvironments()
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const activateEnvironmentHandler = async (id: string) => {
    try {
      setActivatingEnvironment(id)
      await activateEnvironment(id)
      await updateEnvironments()
    } catch (error) {
      console.error(error)
    } finally {
      setActivatingEnvironment(null)
    }
  }

  const deactivateEnvironmentHandler = async (id: string) => {
    try {
      setActivatingEnvironment(id)
      await deactivateEnvironment(id)
      await updateEnvironments()
    } catch (error) {
      console.error(error)
    } finally {
      setActivatingEnvironment(null)
    }
  }

  const deleteEnvironmentHandler = async (id: string) => {
    try {
      console.log(`deleteEnvironmentHandler: ${id}`)
      setDeletingEnvironment(id)
      const response = await deleteEnvironment(id)
      await updateEnvironments()
      return response
    } catch (error) {
      console.error(error)
      throw error
    } finally {
      setDeletingEnvironment(null)
    }
  }

  const duplicateEnvironmentHandler = async (id: string, environment: EnvironmentInput) => {
    try {
      console.log(`duplicateEnvironmentHandler: ${environment}`)
      const response = await duplicateEnvironment(id, environment)
      await updateEnvironments()
      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const updateEnvironmentHandler = async (id: string, name: string) => {
    console.log(`updateEnvironmentHandler: ${id} ${name}`)
    try {
      await updateEnvironment(id, { name })
      await updateEnvironments()
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  // const renameEnvironmentHandler = (id: string, newName: string) => {
  //   setEnvironments(environments.map(env => 
  //     env.id === id ? { ...env, name: newName } : env
  //   ))
  // }

  // const uploadEnvironmentHandler = (env: Environment) => {
  //   console.log(env)
  // }

  useEffect(() => {
    const listEnvironments = async () => {
      await updateEnvironments()
    }
    listEnvironments()
  }, [])

  return (
    <div className="container min-w-[100vw] min-h-screen mx-auto p-4">
      <CreateEnvironmentDialog environments={environments} createEnvironmentHandler={createEnvironmentHandler}>
        <Button className="mb-4">Create Environment</Button>
      </CreateEnvironmentDialog>

      <Button className="mb-4 mx-2" onClick={async () => {
        await updateEnvironments()
        toast({
          title: "Success",
          description: "Environments refreshed",
        })
      }}>Refresh</Button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {environments.map((env: Environment) => (
          <Card key={env.id} className={`relative ${env.status === "running" ? "ring-2 ring-slate-500" : ""}`}>
            <div className='relative'>
              {deletingEnvironment === env.id && (
                <div className="absolute top-0 left-0 w-full h-full bg-zinc-200/50 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-zinc-900 dark:text-zinc-50 animate-spin mr-2" /> Deleting...
                </div>
              )}
              <StatusBadge status={env.status || 'Unknown'} className="my-2 mr-3" />
              {env.status === "running" && (
                <div className="absolute top-[50px] right-[28px] animate-spin">
                  <Fan className="w-6 h-6 text-zinc-900 dark:text-zinc-50" />
              </div>
              )}
              <CardContent className="pt-6">
                <div className="text-4xl mb-2">🖥️</div>
                <h3 className="text-lg font-semibold">{env.name}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{env.metadata?.["base_image"] as string}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                  <SettingsEnvironmentDialog environment={env} updateEnvironmentHandler={updateEnvironmentHandler}>
                    <Button variant="ghost" size="icon">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </SettingsEnvironmentDialog>
                  <LogDisplayDialog environment={env}>
                    <Button variant="ghost" size="icon">
                      <SquareTerminal className="w-4 h-4" />
                    </Button>
                  </LogDisplayDialog>
                  <DuplicateEnvironmentDialog environment={env} environments={environments} duplicateEnvironmentHandler={duplicateEnvironmentHandler}>
                    <Button variant="ghost" size="icon">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </DuplicateEnvironmentDialog>
                  <CustomAlertDialog 
                    title={`Delete ${env.name} ?`} 
                    description="This action cannot be undone. This will permanently delete your environment." 
                    cancelText="Cancel" 
                    actionText="Delete" 
                    onAction={() => deleteEnvironmentHandler(env.id || "")}
                  >
                    <Button variant="ghost" size="icon">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CustomAlertDialog>
                </div>
                <Button disabled={activatingEnvironment === env.id} onClick={() => env.status === "running" ? deactivateEnvironmentHandler(env.id || "") : activateEnvironmentHandler(env.id || "")}>
                  {activatingEnvironment === env.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />} {env.status === "running" ? "Deactivate" : "Activate"}
                </Button>
              </CardFooter>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}