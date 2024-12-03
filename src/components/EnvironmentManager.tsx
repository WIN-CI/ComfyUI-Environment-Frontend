import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { ExternalLink, HelpCircle, Loader2, RefreshCcw, Settings } from 'lucide-react'
import { Environment, EnvironmentInput } from '@/types/Environment'
import CreateEnvironmentDialog from './dialogs/CreateEnvironmentDialog'
import { useToast } from '@/hooks/use-toast'
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
import UserSettingsDialog from './dialogs/UserSettingsDialog'
import { UserSettings } from '@/types/UserSettings'
import EnvironmentCard from './EnvironmentCard'

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
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: `Failed to activate environment: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setActivatingEnvironment(null)
    }
  }

  const deactivateEnvironmentHandler = async (id: string) => {
    try {
      setActivatingEnvironment(id)
      await deactivateEnvironment(id)
      await updateEnvironments()
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: `Failed to deactivate environment: ${error.message}`,
        variant: "destructive",
      })
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
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: `Failed to delete environment: ${error.message}`,
        variant: "destructive",
      })
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

      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-teal-600 text-transparent bg-clip-text title">
        ComfyUI Environment Manager
      </h1>

      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4 md:mb-0">
          <CreateEnvironmentDialog userSettings={userSettings} environments={environments} createEnvironmentHandler={createEnvironmentHandler}>
            <Button className="bg-blue-600 hover:bg-blue-700">Create Environment</Button>
          </CreateEnvironmentDialog>

          <Button 
            className="bg-teal-600 hover:bg-teal-700"
            onClick={async () => {
              setIsLoading(true)
              await updateEnvironments()
              setIsLoading(false)
            }}
          >
            <RefreshCcw className="w-4 h-4 mr-2" />Refresh
          </Button>

          <UserSettingsDialog updateUserSettingsHandler={updateUserSettingsHandler}>
            <Button className="bg-purple-600 hover:bg-purple-700"><Settings className="w-4 h-4 mr-2" />Settings</Button>
          </UserSettingsDialog>
        </div>

        <div className="flex items-center gap-4">
          <a
              href={`https://cyber-damselfly-b6c.notion.site/ComfyUI-Environment-Manager-14ffd5b1ca3b804abafbdb4bd6b8068e`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <Button className="bg-slate-600 hover:bg-slate-700">
                  <ExternalLink className="w-4 h-4" />Documentation
              </Button>
            </a>

          <a href='https://ko-fi.com/A0A616TJHD' target='_blank' rel="noopener noreferrer" className="mt-4 md:mt-0">
            <img height='36' style={{border: '0px', height: '36px'}} src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' alt='Buy Me a Coffee at ko-fi.com' />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {environments.map((env: Environment) => (
          <EnvironmentCard
            key={env.id}
            environment={env}
            environments={environments}
            activatingEnvironment={activatingEnvironment}
            deletingEnvironment={deletingEnvironment}
            updateEnvironmentHandler={updateEnvironmentHandler}
            duplicateEnvironmentHandler={duplicateEnvironmentHandler}
            deleteEnvironmentHandler={deleteEnvironmentHandler}
            activateEnvironmentHandler={activateEnvironmentHandler}
            deactivateEnvironmentHandler={deactivateEnvironmentHandler}
          />
        ))}
      </div>
    </div>
  )
}

