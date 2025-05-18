"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { MicIcon, MicOffIcon } from "lucide-react"

interface SpeechRecognitionProps {
  isActive: boolean
  setIsActive: (active: boolean) => void
  onSpeechRecognized: (text: string) => void
  addDebugMessage: (message: string) => void
}

export function SpeechRecognition({
  isActive,
  setIsActive,
  onSpeechRecognized,
  addDebugMessage,
}: SpeechRecognitionProps) {
  const [error, setError] = useState<string | null>(null)

  // In a real implementation, this would use Azure Speech SDK
  // For now, we'll use the Web Speech API for demonstration
  const recognitionRef = useRef<any>(null)

  const startRecognition = () => {
    try {
      // Check if browser supports speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (!SpeechRecognition) {
        setError("Speech recognition not supported in this browser")
        addDebugMessage("Speech recognition not supported")
        return
      }

      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onstart = () => {
        setIsActive(true)
        setError(null)
        addDebugMessage("Speech recognition started")
      }

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        const fullTranscript = finalTranscript || interimTranscript
        onSpeechRecognized(fullTranscript)

        if (finalTranscript) {
          addDebugMessage(`Recognized speech: ${finalTranscript}`)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        setError(`Speech recognition error: ${event.error}`)
        addDebugMessage(`Speech recognition error: ${event.error}`)

        if (event.error === "not-allowed") {
          setIsActive(false)
        }
      }

      recognitionRef.current.onend = () => {
        // Restart if it was active (to make it continuous)
        if (isActive) {
          recognitionRef.current.start()
          addDebugMessage("Restarting speech recognition")
        } else {
          addDebugMessage("Speech recognition ended")
        }
      }

      recognitionRef.current.start()
    } catch (err) {
      setError(`Could not start speech recognition: ${err}`)
      addDebugMessage(`Speech recognition error: ${err}`)
      setIsActive(false)
    }
  }

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
      setIsActive(false)
      addDebugMessage("Speech recognition stopped")
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        {isActive ? (
          <Button variant="destructive" onClick={stopRecognition} className="flex items-center">
            <MicOffIcon size={16} className="mr-2" />
            Stop Listening
          </Button>
        ) : (
          <Button className="bg-[#0078D4] hover:bg-[#0063B1] flex items-center" onClick={startRecognition}>
            <MicIcon size={16} className="mr-2" />
            Start Listening
          </Button>
        )}
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">{error}</div>}
    </div>
  )
}
