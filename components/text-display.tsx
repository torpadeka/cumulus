import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface TextDisplayProps {
  content: ReactNode
  emptyMessage?: string
  className?: string
  maxHeight?: string
}

export function TextDisplay({
  content,
  emptyMessage = "No data available...",
  className,
  maxHeight = "200px",
}: TextDisplayProps) {
  return (
    <div
      className={cn("bg-gray-50 rounded-md p-4 border border-gray-200 overflow-y-auto font-mono text-sm", className)}
      style={{ maxHeight }}
    >
      {content ? (
        <div className="whitespace-pre-line">{content}</div>
      ) : (
        <p className="text-gray-400 italic">{emptyMessage}</p>
      )}
    </div>
  )
}
