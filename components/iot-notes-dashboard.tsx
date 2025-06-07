"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    PenTool,
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
    Calendar,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Copy, Languages } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Note {
    id: string;
    text: string;
    timestamp: string;
    dateKey: string;
    deviceId?: string;
}

interface UserType {
    id: string;
    username: string;
    email: string;
    deviceId?: string;
}

interface IoTNotesDashboardProps {
    user: UserType;
}

export default function IoTNotesDashboard({ user }: IoTNotesDashboardProps) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [currentDate, setCurrentDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [isConnected, setIsConnected] = useState(true);
    const [lastReceived, setLastReceived] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showSummaryDialog, setShowSummaryDialog] = useState(false);
    const [summary, setSummary] = useState("");
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summaryLanguage, setSummaryLanguage] = useState<
        "english" | "indonesian"
    >("english");
    const router = useRouter();

    // Fetch available dates
    const fetchAvailableDates = async () => {
        try {
            const response = await fetch("/api/notes/dates");
            if (response.ok) {
                const data = await response.json();
                setAvailableDates(data.dates || []);
            }
        } catch (error) {
            console.error("Error fetching dates:", error);
        }
    };

    // Fetch notes for specific date
    const fetchNotes = async (date?: string) => {
        try {
            setIsLoading(true);
            const targetDate = date || currentDate;
            const response = await fetch(`/api/notes?date=${targetDate}`);
            if (response.ok) {
                const data = await response.json();
                setNotes(data.notes || []);
                if (data.notes && data.notes.length > 0) {
                    setLastReceived(new Date(data.notes[0].timestamp));
                }
                setIsConnected(true);
            } else {
                setIsConnected(false);
            }
        } catch (error) {
            console.error("Error fetching notes:", error);
            setIsConnected(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchAvailableDates();
        fetchNotes();

        // Poll for new notes every 5 seconds (only for current date)
        const interval = setInterval(() => {
            const today = new Date().toISOString().split("T")[0];
            if (currentDate === today) {
                fetchNotes();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [currentDate]);

    // Check connection status
    useEffect(() => {
        const checkConnection = setInterval(() => {
            const now = new Date();
            if (
                lastReceived &&
                now.getTime() - lastReceived.getTime() > 300000
            ) {
                setIsConnected(false);
            } else if (lastReceived) {
                setIsConnected(true);
            }
        }, 30000);

        return () => clearInterval(checkConnection);
    }, [lastReceived]);

    const deleteNote = async (id: string) => {
        setNotes((prev) => prev.filter((note) => note.id !== id));
    };

    const clearDayNotes = async () => {
        try {
            const response = await fetch(`/api/notes?date=${currentDate}`, {
                method: "DELETE",
            });
            if (response.ok) {
                setNotes([]);
                fetchAvailableDates(); // Refresh available dates
            }
        } catch (error) {
            console.error("Error clearing notes:", error);
        }
    };

    const exportNotes = () => {
        const notesText = notes
            .map((note) => {
                const date = new Date(note.timestamp).toLocaleString();
                return `[${date}] ${
                    note.deviceId ? `[${note.deviceId}] ` : ""
                }${note.text}`;
            })
            .join("\n\n");

        const blob = new Blob([notesText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `notes-${currentDate}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleTimeString();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000)
            .toISOString()
            .split("T")[0];

        if (dateString === today) return "Today";
        if (dateString === yesterday) return "Yesterday";
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const navigateDate = (direction: "prev" | "next") => {
        const currentIndex = availableDates.indexOf(currentDate);
        if (direction === "prev" && currentIndex < availableDates.length - 1) {
            setCurrentDate(availableDates[currentIndex + 1]);
        } else if (direction === "next" && currentIndex > 0) {
            setCurrentDate(availableDates[currentIndex - 1]);
        }
    };

    const summarizeNotes = async () => {
        if (notes.length === 0) return;

        setIsSummarizing(true);
        setShowSummaryDialog(true);
        setSummary("");

        try {
            const notesText = notes
                .map((note) => {
                    const date = new Date(note.timestamp).toLocaleString();
                    return `[${date}] ${
                        note.deviceId ? `[${note.deviceId}] ` : ""
                    }${note.text}`;
                })
                .join("\n\n");

            const response = await fetch("/api/gpt", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: notesText,
                    language: summaryLanguage,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setSummary(data.response || "No summary generated.");
            } else {
                setSummary("Failed to generate summary. Please try again.");
            }
        } catch (error) {
            console.error("Error generating summary:", error);
            setSummary(
                "Error generating summary. Please check your connection and try again."
            );
        } finally {
            setIsSummarizing(false);
        }
    };

    const copySummaryToClipboard = () => {
        navigator.clipboard.writeText(summary);
    };

    const isToday = currentDate === new Date().toISOString().split("T")[0];
    const currentDateIndex = availableDates.indexOf(currentDate);
    const canGoNext = currentDateIndex > 0;
    const canGoPrev = currentDateIndex < availableDates.length - 1;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <PenTool className="w-8 h-8 text-cyan-500" />
                    <h1 className="text-3xl font-bold text-gray-800">
                        Cumulus Dashboard
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 mr-4">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">
                            {user.username}
                        </span>
                        <Badge variant="outline" className="text-xs">
                            {user.deviceId}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 mr-4">
                        {isConnected ? (
                            <>
                                <Wifi className="w-4 h-4 text-cyan-500" />
                                <span className="text-sm text-cyan-600">
                                    Connected
                                </span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-4 h-4 text-red-500" />
                                <span className="text-sm text-red-600">
                                    Disconnected
                                </span>
                            </>
                        )}
                    </div>
                    <Button
                        onClick={() => fetchNotes()}
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                    >
                        <RefreshCw
                            className={`w-4 h-4 mr-2 ${
                                isLoading ? "animate-spin" : ""
                            }`}
                        />
                        Refresh
                    </Button>
                    <Button
                        onClick={exportNotes}
                        variant="outline"
                        size="sm"
                        disabled={notes.length === 0}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button
                        onClick={clearDayNotes}
                        variant="outline"
                        size="sm"
                        disabled={notes.length === 0}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Day
                    </Button>
                    <Button onClick={handleLogout} variant="outline" size="sm">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Date Navigation */}
                <Card className="mb-6 bg-white border-l-4 border-l-cyan-500">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Calendar className="w-5 h-5 text-cyan-500" />
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {formatDate(currentDate)}
                                </h3>
                                {isToday && (
                                    <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200">
                                        Live
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => navigateDate("prev")}
                                    variant="outline"
                                    size="sm"
                                    disabled={!canGoPrev}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Older
                                </Button>
                                <Button
                                    onClick={() =>
                                        setCurrentDate(
                                            new Date()
                                                .toISOString()
                                                .split("T")[0]
                                        )
                                    }
                                    variant="outline"
                                    size="sm"
                                    disabled={isToday}
                                >
                                    Today
                                </Button>
                                <Button
                                    onClick={() => navigateDate("next")}
                                    variant="outline"
                                    size="sm"
                                    disabled={!canGoNext}
                                >
                                    Newer
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        {lastReceived && isToday && (
                            <div className="mt-2 text-sm text-gray-500">
                                Last received:{" "}
                                {formatTimestamp(lastReceived.toISOString())}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Notes Display */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Notes for {formatDate(currentDate)}
                        </h2>
                        <Badge
                            variant="secondary"
                            className="text-sm bg-cyan-100 text-cyan-700"
                        >
                            {notes.length}{" "}
                            {notes.length === 1 ? "note" : "notes"}
                        </Badge>
                    </div>

                    {notes.length === 0 ? (
                        <Card className="bg-white">
                            <CardContent className="py-12 text-center">
                                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">
                                    {isToday
                                        ? "No notes received today yet."
                                        : `No notes found for ${formatDate(
                                              currentDate
                                          )}.`}
                                </p>
                                {isToday && (
                                    <p className="text-sm text-gray-400 mt-2">
                                        Your IoT device will automatically send
                                        transcribed text here.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {notes.map((note) => (
                                <Card
                                    key={note.id}
                                    className="bg-white hover:shadow-md transition-shadow border-l-2 border-l-cyan-200"
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Clock className="w-4 h-4" />
                                                <span>
                                                    {formatTimestamp(
                                                        note.timestamp
                                                    )}
                                                </span>
                                                {note.deviceId && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs border-cyan-200 text-cyan-700"
                                                    >
                                                        {note.deviceId}
                                                    </Badge>
                                                )}
                                            </div>
                                            <Button
                                                onClick={() =>
                                                    deleteNote(note.id)
                                                }
                                                variant="ghost"
                                                size="sm"
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-700 leading-relaxed">
                                            {note.text}
                                        </p>
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
                    onClick={summarizeNotes}
                    className="fixed bottom-6 right-6 h-14 px-6 bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg"
                    disabled={isSummarizing}
                >
                    <Sparkles className="w-5 h-5 mr-2" />
                    {isSummarizing ? "Summarizing..." : "Summarize Notes"}
                </Button>
            )}

            {/* Summary Dialog */}
            <Dialog
                open={showSummaryDialog}
                onOpenChange={setShowSummaryDialog}
            >
                <DialogContent className="max-w-3xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-cyan-500" />
                            Notes Summary - {formatDate(currentDate)}
                        </DialogTitle>
                        <DialogDescription>
                            AI-generated summary of your transcribed notes
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        {!isSummarizing && !summary && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Languages className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">
                                        Summary Language:
                                    </span>
                                </div>
                                <Select
                                    value={summaryLanguage}
                                    onValueChange={(
                                        value: "english" | "indonesian"
                                    ) => setSummaryLanguage(value)}
                                >
                                    <SelectTrigger className="w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="english">
                                            English
                                        </SelectItem>
                                        <SelectItem value="indonesian">
                                            Bahasa Indonesia
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={summarizeNotes}
                                    className="w-full bg-cyan-500 hover:bg-cyan-600"
                                    disabled={isSummarizing}
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate Summary
                                </Button>
                            </div>
                        )}

                        {isSummarizing ? (
                            <div className="flex items-center justify-center py-8">
                                <RefreshCw className="w-6 h-6 animate-spin mr-2 text-cyan-500" />
                                <span>
                                    Generating summary in{" "}
                                    {summaryLanguage === "english"
                                        ? "English"
                                        : "Bahasa Indonesia"}
                                    ...
                                </span>
                            </div>
                        ) : summary ? (
                            <div className="space-y-4">
                                <div className="max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                                    <div className="prose prose-sm max-w-none text-gray-700">
                                        <ReactMarkdown
                                            components={{
                                                h1: ({ children }) => (
                                                    <h1 className="text-xl font-bold mb-3 text-gray-800">
                                                        {children}
                                                    </h1>
                                                ),
                                                h2: ({ children }) => (
                                                    <h2 className="text-lg font-semibold mb-2 text-gray-800">
                                                        {children}
                                                    </h2>
                                                ),
                                                h3: ({ children }) => (
                                                    <h3 className="text-base font-semibold mb-2 text-gray-800">
                                                        {children}
                                                    </h3>
                                                ),
                                                p: ({ children }) => (
                                                    <p className="mb-3 leading-relaxed">
                                                        {children}
                                                    </p>
                                                ),
                                                ul: ({ children }) => (
                                                    <ul className="list-disc pl-5 mb-3 space-y-1">
                                                        {children}
                                                    </ul>
                                                ),
                                                ol: ({ children }) => (
                                                    <ol className="list-decimal pl-5 mb-3 space-y-1">
                                                        {children}
                                                    </ol>
                                                ),
                                                li: ({ children }) => (
                                                    <li className="leading-relaxed">
                                                        {children}
                                                    </li>
                                                ),
                                                strong: ({ children }) => (
                                                    <strong className="font-semibold text-gray-800">
                                                        {children}
                                                    </strong>
                                                ),
                                                em: ({ children }) => (
                                                    <em className="italic">
                                                        {children}
                                                    </em>
                                                ),
                                                code: ({ children }) => (
                                                    <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono">
                                                        {children}
                                                    </code>
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
                                    <Badge
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        {summaryLanguage === "english"
                                            ? "English"
                                            : "Bahasa Indonesia"}
                                    </Badge>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => {
                                                setSummary("");
                                                setIsSummarizing(false);
                                            }}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Generate New
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
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
