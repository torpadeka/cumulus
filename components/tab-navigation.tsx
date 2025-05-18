"use client"
import { useRouter } from "next/navigation"

interface TabNavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  const router = useRouter()

  const handleTabClick = (tab: string) => {
    setActiveTab(tab)
    router.push(`?tab=${tab}`)
  }

  return (
    <div className="flex border-b border-gray-200 mb-6">
      <button
        onClick={() => handleTabClick("dashboard")}
        className={`px-6 py-3 font-medium text-sm transition-colors duration-200 ${
          activeTab === "dashboard"
            ? "text-[#0078D4] border-b-2 border-[#0078D4]"
            : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300"
        }`}
      >
        Dashboard
      </button>
      <button
        onClick={() => handleTabClick("chat")}
        className={`px-6 py-3 font-medium text-sm transition-colors duration-200 ${
          activeTab === "chat"
            ? "text-[#0078D4] border-b-2 border-[#0078D4]"
            : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300"
        }`}
      >
        Chat
      </button>
      <button
        onClick={() => handleTabClick("settings")}
        className={`px-6 py-3 font-medium text-sm transition-colors duration-200 ${
          activeTab === "settings"
            ? "text-[#0078D4] border-b-2 border-[#0078D4]"
            : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300"
        }`}
      >
        Settings
      </button>
    </div>
  )
}
