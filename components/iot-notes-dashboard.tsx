"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    PenTool,
    Trash2,
    Download,
    Clock,
    Wifi,
    WifiOff,
    RefreshCw,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Note {
    id: string;
    text: string;
    timestamp: string;
    deviceId?: string;
}

export default function Component() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isConnected, setIsConnected] = useState(true);
    const [lastReceived, setLastReceived] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showSummaryDialog, setShowSummaryDialog] = useState(false);
    const [summary, setSummary] = useState("");
    const [isSummarizing, setIsSummarizing] = useState(false);

    // Fetch notes from API
    const fetchNotes = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/notes");
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

    // Initial load and polling
    useEffect(() => {
        fetchNotes();

        // Poll for new notes every 5 seconds
        const interval = setInterval(fetchNotes, 1000);

        return () => clearInterval(interval);
    }, []);

    // Check connection status
    useEffect(() => {
        const checkConnection = setInterval(() => {
            const now = new Date();
            if (
                lastReceived &&
                now.getTime() - lastReceived.getTime() > 300000
            ) {
                // 5 minutes
                setIsConnected(false);
            } else if (lastReceived) {
                setIsConnected(true);
            }
        }, 30000); // Check every 30 seconds

        return () => clearInterval(checkConnection);
    }, [lastReceived]);

    const deleteNote = async (id: string) => {
        // For individual note deletion, we'd need to add a DELETE endpoint with ID
        // For now, we'll just update the local state and it will sync on next poll
        setNotes((prev) => prev.filter((note) => note.id !== id));
    };

    const clearAllNotes = async () => {
        try {
            const response = await fetch("/api/notes", { method: "DELETE" });
            if (response.ok) {
                setNotes([]);
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
        a.download = `iot-notes-${new Date().toISOString().split("T")[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    const summarizeNotes = async () => {
        if (notes.length === 0) return;

        setIsSummarizing(true);
        setShowSummaryDialog(true);
        setSummary("");

        try {
            // Prepare the notes text for summarization
            const notesText = notes
                .map((note) => {
                    const date = new Date(note.timestamp).toLocaleString();
                    return `[${date}] ${
                        note.deviceId ? `[${note.deviceId}] ` : ""
                    }${note.text}`;
                })
                .join("\n\n");

            const prompt = `Please provide a comprehensive summary of the following transcribed notes. Focus on key topics, important decisions, action items, and main themes discussed:\n\n${notesText}.\n\nPlease focus on just giving the summary to the best of your ability`;

            const response = await fetch("/api/gpt", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt }),
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

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <PenTool className="w-8 h-8 text-gray-700" />
                    <h1 className="text-3xl font-bold text-gray-800">
                        IoT Notes Dashboard
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 mr-4">
                        {isConnected ? (
                            <>
                                <Wifi className="w-4 h-4 text-green-500" />
                                <span className="text-sm text-green-600">
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
                        onClick={fetchNotes}
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
                        onClick={clearAllNotes}
                        variant="outline"
                        size="sm"
                        disabled={notes.length === 0}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                    </Button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Connection Status */}
                <Card className="mb-6 bg-white">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-3 h-3 rounded-full ${
                                        isConnected
                                            ? "bg-green-500"
                                            : "bg-red-500"
                                    }`}
                                ></div>
                                <span
                                    className={`text-sm font-medium ${
                                        isConnected
                                            ? "text-green-500"
                                            : "text-red-500"
                                    }`}
                                >
                                    {isConnected
                                        ? "IoT Device Connected"
                                        : "Waiting for IoT Device..."}
                                </span>
                            </div>
                            {lastReceived && (
                                <span className="text-sm text-gray-500">
                                    Last received:{" "}
                                    {formatTimestamp(
                                        lastReceived.toISOString()
                                    )}
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Notes Display */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Received Notes
                        </h2>
                        <Badge variant="secondary" className="text-sm">
                            {notes.length}{" "}
                            {notes.length === 1 ? "note" : "notes"}
                        </Badge>
                    </div>

                    {notes.length === 0 ? (
                        <Card className="bg-white">
                            <CardContent className="py-12 text-center">
                                <Wifi className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">
                                    No notes received yet.
                                </p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Waiting for your IoT device to send
                                    transcribed text...
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {notes.map((note) => (
                                <Card
                                    key={note.id}
                                    className="bg-white hover:shadow-md transition-shadow"
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
                                                        className="text-xs"
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
                    className="fixed bottom-6 right-6 h-14 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
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
                            <Sparkles className="w-5 h-5" />
                            Notes Summary
                        </DialogTitle>
                        <DialogDescription>
                            AI-generated summary of all your transcribed notes
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        {isSummarizing ? (
                            <div className="flex items-center justify-center py-8">
                                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                                <span>Generating summary...</span>
                            </div>
                        ) : (
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
                                                    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-3">
                                                        {children}
                                                    </blockquote>
                                                ),
                                            }}
                                        >
                                            {summary || "No summary available."}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                                {summary && (
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={copySummaryToClipboard}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copy Summary
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
