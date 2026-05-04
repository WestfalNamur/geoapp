import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-semibold tracking-tight">app-spa</h1>
      <p className="text-muted-foreground">Vite + React + TypeScript + Tailwind + shadcn/ui</p>
      <Button>Click me</Button>
    </div>
  )
}

export default App
