"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Trash2,
  Download,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Cloud,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sparkles, Copy, Languages } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, isToday, isYesterday, parseISO } from "date-fns"

interface Note {
  id: string
  text: string
  timestamp: string
  dateKey: string
  deviceId?: string
}

interface UserType {
  id: string
  username: string
  email: string
  deviceId?: string
}

interface IoTNotesDashboardProps {
  user: UserType
}

export default function IoTNotesDashboard({ user }: IoTNotesDashboardProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [isConnected, setIsConnected] = useState(true)
  const [lastReceived, setLastReceived] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSummaryDialog, setShowSummaryDialog] = useState(false)
  const [summary, setSummary] = useState("")
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summaryLanguage, setSummaryLanguage] = useState<"english" | "indonesian">("english")
  const [calendarOpen, setCalendarOpen] = useState(false)
  const router = useRouter()

  // Fetch available dates
  const fetchAvailableDates = async () => {
    try {
      const response = await fetch("/api/notes/dates")
      if (response.ok) {
        const data = await response.json()
        setAvailableDates(data.dates || [])
      }
    } catch (error) {
      console.error("Error fetching dates:", error)
    }
  }

  // Fetch notes for specific date
  const fetchNotes = async (date?: string) => {
    try {
      setIsLoading(true)
      const targetDate = date || currentDate
      const response = await fetch(`/api/notes?date=${targetDate}`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes || [])
        if (data.notes && data.notes.length > 0) {
          setLastReceived(new Date(data.notes[0].timestamp))
        }
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      console.error("Error fetching notes:", error)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

 useEffect(() => {
  // We still fetch dates and notes on initial load
  fetchAvailableDates()
  fetchNotes(currentDate) // Fetch notes for the current date whenever it changes

  const today = new Date().toISOString().split("T")[0]

  // Only set up the polling interval if the currently viewed date is today
  if (currentDate === today) {
    const interval = setInterval(() => {
      console.log("Polling for new notes on:", currentDate)
      fetchNotes(currentDate)
    }, 5000)

    // The cleanup function for this effect.
    // It runs when the component unmounts OR when `currentDate` changes.
    // This is crucial for stopping the old interval.
    return () => clearInterval(interval)
  }

  // If currentDate is not today, no interval is created and any existing one from a previous render is cleared.
}, [currentDate])

  // When current date changes, fetch notes for that date
  useEffect(() => {
    fetchNotes(currentDate)
  }, [currentDate])

  // Check connection status
  useEffect(() => {
    const checkConnection = setInterval(() => {
      const now = new Date()
      if (lastReceived && now.getTime() - lastReceived.getTime() > 300000) {
        setIsConnected(false)
      } else if (lastReceived) {
        setIsConnected(true)
      }
    }, 30000)

    return () => clearInterval(checkConnection)
  }, [lastReceived])

  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id))
  }

  const clearDayNotes = async () => {
    try {
      const response = await fetch(`/api/notes?date=${currentDate}`, { method: "DELETE" })
      if (response.ok) {
        setNotes([])
        fetchAvailableDates() // Refresh available dates
      }
    } catch (error) {
      console.error("Error clearing notes:", error)
    }
  }

  const exportNotes = () => {
    const notesText = notes
      .map((note) => {
        const date = new Date(note.timestamp).toLocaleString()
        return `[${date}] ${note.deviceId ? `[${note.deviceId}] ` : ""}${note.text}`
      })
      .join("\n\n")

    const blob = new Blob([notesText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `notes-${currentDate}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleTimeString()
  }

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString)

    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"

    return format(date, "EEEE, MMMM d, yyyy")
  }

  const navigateDate = (direction: "prev" | "next") => {
    const currentIndex = availableDates.indexOf(currentDate)
    if (direction === "prev" && currentIndex < availableDates.length - 1) {
      setCurrentDate(availableDates[currentIndex + 1])
    } else if (direction === "next" && currentIndex > 0) {
      setCurrentDate(availableDates[currentIndex - 1])
    }
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd")
      setCurrentDate(formattedDate)
      setCalendarOpen(false)
    }
  }

  const summarizeNotes = async () => {
    if (notes.length === 0) return

    setIsSummarizing(true)

    try {
      const notesText = notes
        .map((note) => {
          const date = new Date(note.timestamp).toLocaleString()
          return `[${date}] ${note.deviceId ? `[${note.deviceId}] ` : ""}${note.text}`
        })
        .join("\n\n")

      const response = await fetch("/api/gpt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: notesText,
          language: summaryLanguage,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSummary(data.response || "No summary generated.")
      } else {
        setSummary("Failed to generate summary. Please try again.")
      }
    } catch (error) {
      console.error("Error generating summary:", error)
      setSummary("Error generating summary. Please check your connection and try again.")
    } finally {
      setIsSummarizing(false)
    }
  }

  const copySummaryToClipboard = () => {
    navigator.clipboard.writeText(summary)
  }

  const openSummaryDialog = () => {
    setSummary("")
    setShowSummaryDialog(true)
  }

  const isCurrentDateToday = currentDate === new Date().toISOString().split("T")[0]
  const currentDateIndex = availableDates.indexOf(currentDate)
  const canGoNext = currentDateIndex > 0
  const canGoPrev = currentDateIndex < availableDates.length - 1

  // Highlight dates with notes in the calendar
  const highlightedDates = availableDates.map((date) => parseISO(date))

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8 p-6 -m-6" style={{ backgroundColor: "#005485" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Cumulus Dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 mr-4">
              <User className="w-4 h-4 text-white" />
              <span className="text-sm text-white">{user.username}</span>
              <Badge variant="outline" className="text-xs border-white text-white bg-transparent">
                {user.deviceId}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mr-4">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-cyan-300" />
                  <span className="text-sm text-cyan-300">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-300" />
                  <span className="text-sm text-red-300">Disconnected</span>
                </>
              )}
            </div>
            <Button
              onClick={() => fetchNotes()}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="border-white text-black hover:bg-white hover:text-blue-900"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={exportNotes}
              variant="outline"
              size="sm"
              disabled={notes.length === 0}
              className="border-white text-black hover:bg-white hover:text-blue-900"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={clearDayNotes}
              variant="outline"
              size="sm"
              disabled={notes.length === 0}
              className="border-white text-black hover:bg-white hover:text-blue-900"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Day
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-white text-black hover:bg-white hover:text-blue-900"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Date Navigation */}
        <Card className="mb-6 bg-white border-l-4 border-l-cyan-500">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CalendarIcon className="w-5 h-5 text-cyan-500" />
                <h3 className="text-lg font-semibold text-gray-800">{formatDate(currentDate)}</h3>
                {isCurrentDateToday && <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200">Live</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => navigateDate("prev")} variant="outline" size="sm" disabled={!canGoPrev}>
                  <ChevronLeft className="w-4 h-4" />
                  Older
                </Button>

                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Calendar
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={parseISO(currentDate)}
                      onSelect={handleCalendarSelect}
                      modifiers={{
                        highlighted: highlightedDates,
                      }}
                      modifiersStyles={{
                        highlighted: {
                          backgroundColor: "rgba(6, 182, 212, 0.1)",
                          fontWeight: "bold",
                          borderBottom: "2px solid #06b6d4",
                        },
                      }}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>

                <Button
                  onClick={() => setCurrentDate(new Date().toISOString().split("T")[0])}
                  variant="outline"
                  size="sm"
                  disabled={isCurrentDateToday}
                >
                  Today
                </Button>
                <Button onClick={() => navigateDate("next")} variant="outline" size="sm" disabled={!canGoNext}>
                  Newer
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {lastReceived && isCurrentDateToday && (
              <div className="mt-2 text-sm text-gray-500">
                Last received: {formatTimestamp(lastReceived.toISOString())}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes Display */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Notes for {formatDate(currentDate)}</h2>
            <Badge variant="secondary" className="text-sm bg-cyan-100 text-cyan-700">
              {notes.length} {notes.length === 1 ? "note" : "notes"}
            </Badge>
          </div>

          {notes.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="py-12 text-center">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {isCurrentDateToday
                    ? "No notes received today yet."
                    : `No notes found for ${formatDate(currentDate)}.`}
                </p>
                {isCurrentDateToday && (
                  <p className="text-sm text-gray-400 mt-2">
                    Your IoT device will automatically send transcribed text here.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <Card key={note.id} className="bg-white hover:shadow-md transition-shadow border-l-2 border-l-cyan-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimestamp(note.timestamp)}</span>
                        {note.deviceId && (
                          <Badge variant="outline" className="text-xs border-cyan-200 text-cyan-700">
                            {note.deviceId}
                          </Badge>
                        )}
                      </div>
                      <Button
                        onClick={() => deleteNote(note.id)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{note.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Summarize Button */}
      {notes.length > 0 && (
        <Button
          onClick={openSummaryDialog}
          className="fixed bottom-6 right-6 h-14 px-6 bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Summarize Notes
        </Button>
      )}

      {/* Summary Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-500" />
              Notes Summary - {formatDate(currentDate)}
            </DialogTitle>
            <DialogDescription>Generate an AI summary of your notes</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {!summary && !isSummarizing ? (
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Languages className="w-5 h-5 text-cyan-500" />
                    <h3 className="text-base font-medium">Select Summary Language</h3>
                  </div>
                  <p className="text-sm text-gray-500">
                    Choose the language for your summary. The AI will generate a comprehensive summary in your selected
                    language.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      summaryLanguage === "english"
                        ? "border-cyan-500 bg-cyan-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSummaryLanguage("english")}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">English</span>
                      {summaryLanguage === "english" && <div className="w-4 h-4 rounded-full bg-cyan-500"></div>}
                    </div>
                    <p className="text-xs text-gray-500">Summary will be generated in English</p>
                  </div>

                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      summaryLanguage === "indonesian"
                        ? "border-cyan-500 bg-cyan-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSummaryLanguage("indonesian")}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Bahasa Indonesia</span>
                      {summaryLanguage === "indonesian" && <div className="w-4 h-4 rounded-full bg-cyan-500"></div>}
                    </div>
                    <p className="text-xs text-gray-500">Ringkasan akan dibuat dalam Bahasa Indonesia</p>
                  </div>
                </div>

                <Button
                  onClick={summarizeNotes}
                  className="w-full bg-cyan-500 hover:bg-cyan-600"
                  disabled={isSummarizing}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Summary
                </Button>
              </div>
            ) : isSummarizing ? (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="w-10 h-10 animate-spin text-cyan-500 mb-4" />
                <p className="text-gray-700">
                  Generating summary in {summaryLanguage === "english" ? "English" : "Bahasa Indonesia"}...
                </p>
                <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-gray-800">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-gray-800">{children}</h2>,
                        h3: ({ children }) => (
                          <h3 className="text-base font-semibold mb-2 text-gray-800">{children}</h3>
                        ),
                        p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => (
                          <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-cyan-300 pl-4 italic text-gray-600 mb-3">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {summary}
                    </ReactMarkdown>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="text-xs border-cyan-200 bg-cyan-50 text-cyan-700">
                    {summaryLanguage === "english" ? "English" : "Bahasa Indonesia"}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSummary("")
                      }}
                      variant="outline"
                      size="sm"
                    >
                      New Summary
                    </Button>
                    <Button
                      onClick={copySummaryToClipboard}
                      variant="outline"
                      size="sm"
                      className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Summary
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
