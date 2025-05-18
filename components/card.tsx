import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface CardProps {
  title: string
  children: ReactNode
  icon?: ReactNode
  statusIndicator?: {
    active: boolean
    label: string
  }
  tooltip?: string
  className?: string
} 

export function Card({ title, children, icon, statusIndicator, tooltip, className }: CardProps) {
  return (
    <div className={cn("bg-white rounded-lg shadow-sm border-l-4 border-[#0078D4] p-5 mb-6", className)}>
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
        <div className="flex items-center">
          {icon && <div className="mr-2 text-[#0078D4]">{icon}</div>}
          <h3 className="text-lg font-medium text-[#0078D4]">{title}</h3>

          {tooltip && (
            <div className="relative ml-2 group">
              <div className="cursor-help text-gray-400">ℹ️</div>
              <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded py-1 px-2 right-0 bottom-full w-48">
                {tooltip}
                <svg
                  className="absolute text-gray-800 h-2 w-full left-0 top-full"
                  x="0px"
                  y="0px"
                  viewBox="0 0 255 255"
                >
                  <polygon className="fill-current" points="0,0 127.5,127.5 255,0" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {statusIndicator && (
          <div className="flex items-center text-sm">
            <div
              className={`h-2.5 w-2.5 rounded-full mr-2 ${statusIndicator.active ? "bg-green-500" : "bg-gray-400"}`}
            ></div>
            <span>{statusIndicator.label}</span>
          </div>
        )}
      </div>

      <div>{children}</div>
    </div>
  )
}
