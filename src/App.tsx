import { EnvironmentManagerComponent } from './components/EnvironmentManager'
import { Toaster } from "@/components/ui/toaster"

function App() {
  return (
    <div className="flex justify-center items-center">
      <EnvironmentManagerComponent />
      <Toaster />
    </div>
  )
}

export default App
