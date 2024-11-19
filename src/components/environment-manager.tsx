import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Fan, Pencil, Copy, Trash2, Play } from 'lucide-react'

type Environment = {
  id: string
  name: string
  release: string
  dockerImage?: string
}

export function EnvironmentManagerComponent() {
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [activeEnvironment, setActiveEnvironment] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newEnvironmentName, setNewEnvironmentName] = useState("")
  const [selectedRelease, setSelectedRelease] = useState("")
  const [customDockerImage, setCustomDockerImage] = useState("")

  const createEnvironment = () => {
    const newEnvironment: Environment = {
      id: Date.now().toString(),
      name: newEnvironmentName,
      release: selectedRelease,
      dockerImage: customDockerImage || undefined,
    }
    setEnvironments([...environments, newEnvironment])
    setIsCreateModalOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setNewEnvironmentName("")
    setSelectedRelease("")
    setCustomDockerImage("")
  }

  const renameEnvironment = (id: string, newName: string) => {
    setEnvironments(environments.map(env => 
      env.id === id ? { ...env, name: newName } : env
    ))
  }

  const duplicateEnvironment = (env: Environment) => {
    const newEnv = { ...env, id: Date.now().toString(), name: `${env.name} (Copy)` }
    setEnvironments([...environments, newEnv])
  }

  const deleteEnvironment = (id: string) => {
    setEnvironments(environments.filter(env => env.id !== id))
    if (activeEnvironment === id) setActiveEnvironment(null)
  }

  const activateEnvironment = (id: string) => {
    setActiveEnvironment(id)
  }

  const deactivateEnvironment = (id: string) => {
    setActiveEnvironment(null)
  }

  return (
    <div className="container min-w-[100vw] min-h-screen mx-auto p-4">
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogTrigger asChild>
          <Button className="mb-4">Create Environment</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Environment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newEnvironmentName}
                onChange={(e) => setNewEnvironmentName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="release" className="text-right">
                ComfyUI Release
              </Label>
              <Select value={selectedRelease} onValueChange={setSelectedRelease}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a release" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="v1.0">v1.0</SelectItem>
                  <SelectItem value="v1.1">v1.1</SelectItem>
                  <SelectItem value="v1.2">v1.2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dockerImage" className="text-right">
                Custom Docker Image
              </Label>
              <Input
                id="dockerImage"
                value={customDockerImage}
                onChange={(e) => setCustomDockerImage(e.target.value)}
                placeholder="Optional: DockerHub image URL"
                className="col-span-3"
              />
            </div>
          </div>
          <Button onClick={createEnvironment}>Create</Button>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {environments.map((env) => (
          <Card key={env.id} className={`relative ${activeEnvironment === env.id ? "ring-2 ring-slate-500" : ""}`}>
            {activeEnvironment === env.id && (
              <div className="absolute top-2 right-2 animate-spin">
                <Fan className="w-6 h-6 text-zinc-900 dark:text-zinc-50" />
              </div>
            )}
            <CardContent className="pt-6">
              <div className="text-4xl mb-2">🖥️</div>
              <h3 className="text-lg font-semibold">{env.name}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{env.release}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => renameEnvironment(env.id, prompt("New name") || env.name)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => duplicateEnvironment(env)}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteEnvironment(env.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={() => activeEnvironment === env.id ? deactivateEnvironment(env.id) : activateEnvironment(env.id)}>
                <Play className="w-4 h-4 mr-2" /> {activeEnvironment === env.id ? "Deactivate" : "Activate"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}