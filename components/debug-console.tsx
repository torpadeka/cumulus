interface DebugConsoleProps {
  messages: string[]
}

export function DebugConsole({ messages }: DebugConsoleProps) {
  return (
    <div
      className="bg-gray-900 text-gray-100 rounded-md p-4 font-mono text-xs overflow-y-auto"
      style={{ maxHeight: "200px" }}
    >
      {messages.length > 0 ? (
        messages.map((message, index) => {
          const parts = message.split("]")
          const timestamp = parts[0].replace("[", "")
          const content = parts.slice(1).join("]")

          return (
            <div key={index} className="mb-1">
              <span className="text-[#00B7C3]">{timestamp}</span>
              <span>{content}</span>
            </div>
          )
        })
      ) : (
        <p className="text-gray-500 italic">No debug messages yet...</p>
      )}
    </div>
  )
}
