import { CloudIcon } from "lucide-react"

export function Header() {
  return (
    <div className="bg-gradient-to-r from-[#0078D4] to-[#0063B1] text-white p-3 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <CloudIcon size={24} className="mr-2" />
          <h1 className="text-xl font-bold">Cumulus AI Assistant</h1>
        </div>
        <div className="flex items-center">
          <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
          <span className="text-xs">System Online</span>
        </div>
      </div>
    </div>
  )
}
