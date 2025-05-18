"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquareIcon, SendIcon } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm Cumulus, your AI assistant. I can see through your camera, listen to your voice, and help answer your questions. How can I assist you today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: input }])
    setInput("")
    setIsLoading(true)

    try {
      // In a real implementation, this would call the Azure OpenAI service
      // For now, we'll simulate a response
      setTimeout(() => {
        const responses = [
          "I've analyzed the information from your camera and microphone. Based on what I can see and hear, I'd recommend focusing on the main subject in better lighting.",
          "From what I can gather through the camera and your speech, it seems like you're asking about data processing. The best approach would be to use Azure's cognitive services for this task.",
          "Based on the visual and audio input, I understand you're looking for information on this topic. Let me summarize what I've detected and provide a helpful response.",
          "I've processed the visual and audio data. The text I detected appears to be about technology, and your question seems related to implementation details. Let me help clarify that for you.",
        ]

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: responses[Math.floor(Math.random() * responses.length)],
          },
        ])
        setIsLoading(false)
      }, 1500)
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error processing your request. Please try again.",
        },
      ])
      setIsLoading(false)
    }
  }

  return (
    <Card
      title="AI Chat Assistant"
      icon={<MessageSquareIcon size={20} />}
      tooltip="Chat with Cumulus about detected content"
      className="h-[calc(100vh-220px)] flex flex-col"
    >
      <div className="flex-1 overflow-y-auto mb-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`max-w-[80%] p-3 rounded-2xl ${
                message.role === "user"
                  ? "ml-auto bg-[#50A0DC] text-white rounded-br-sm"
                  : "mr-auto bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}
            >
              {message.content}
            </div>
          ))}
          {isLoading && (
            <div className="mr-auto bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm max-w-[80%] p-3">
              <div className="flex space-x-2">
                <div
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-md">
        <Input
          placeholder="Type your message here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSendMessage()
            }
          }}
          className="flex-1"
          disabled={isLoading}
        />
        <Button
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          className="bg-[#0078D4] hover:bg-[#0063B1]"
        >
          <SendIcon size={18} />
        </Button>
      </div>
    </Card>
  )
}
