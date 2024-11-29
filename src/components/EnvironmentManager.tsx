import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Fan, Settings, Copy, Trash2, Play, SquareTerminal, Loader2, RefreshCcw } from 'lucide-react'
import { Environment, EnvironmentInput } from '@/types/Environment'
import CreateEnvironmentDialog from './dialogs/CreateEnvironmentDialog'
import { useToast } from '@/hooks/use-toast'
import { StatusBadge } from './utils/StatusBadge'
import { 
  createEnvironment, 
  fetchEnvironments, 
  activateEnvironment, 
  deactivateEnvironment, 
  duplicateEnvironment, 
  deleteEnvironment,
  updateEnvironment,
  getUserSettings,
  updateUserSettings,
} from '@/api/environmentApi'
import DuplicateEnvironmentDialog from './dialogs/DuplicateEnvironmentDialog'
import SettingsEnvironmentDialog from './dialogs/SettingsEnvironmentDialog'
import LogDisplayDialog from './dialogs/LogDisplayDialog'
import { CustomAlertDialog } from './dialogs/CustomAlertDialog'
import UserSettingsDialog from './dialogs/UserSettingsDialog'
import { UserSettings } from '@/types/UserSettings'
import { Skeleton } from '@/components/ui/skeleton'

export function EnvironmentManagerComponent() {
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [activatingEnvironment, setActivatingEnvironment] = useState<string | null>(null)
  const [deletingEnvironment, setDeletingEnvironment] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const { toast } = useToast()

  const updateEnvironments = async () => {
    try {
      const fetchedEnvironments = await fetchEnvironments()
      setEnvironments(fetchedEnvironments)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to fetch environments:', error)
      // Keep isLoading true to continue showing the loading state
    }
  }

  const createEnvironmentHandler = async (environment: EnvironmentInput) => {
    try {
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

  const updateUserSettingsHandler = async (settings: UserSettings) => {
    try {
      await updateUserSettings(settings)
      setUserSettings(settings)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      await updateEnvironments()
      const settings = await getUserSettings()
      console.log(`settings: ${JSON.stringify(settings)}`)
      setUserSettings(settings)
    }

    const retryInterval = setInterval(() => {
      if (isLoading) {
        fetchData()
      }
    }, 2000)

    fetchData()

    return () => clearInterval(retryInterval)
  }, [isLoading])

  return (
    <div className="container min-w-[100vw] min-h-screen mx-auto p-4 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-zinc-200/50 dark:bg-zinc-800/50 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <Loader2 className="w-12 h-12 text-zinc-900 dark:text-zinc-50 animate-spin mb-4" />
          <p className="text-zinc-900 dark:text-zinc-50 text-lg font-semibold">
            Connecting to server...
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Please wait while we establish a connection.
          </p>
        </div>
      )}

      <div className="flex items-center">
        <CreateEnvironmentDialog userSettings={userSettings} environments={environments} createEnvironmentHandler={createEnvironmentHandler}>
          <Button className="mb-4">Create Environment</Button>
        </CreateEnvironmentDialog>


        <Button className="mb-4 mx-2" onClick={async () => {
          setIsLoading(true)
          await updateEnvironments()
        }}><RefreshCcw className="w-4 h-4" />Refresh</Button>

        <UserSettingsDialog updateUserSettingsHandler={updateUserSettingsHandler}>
          <Button className="mb-4"><Settings className="w-4 h-4" />Settings</Button>
        </UserSettingsDialog>
      </div>

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

