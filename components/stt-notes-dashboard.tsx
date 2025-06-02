"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PenTool, Mic, MicOff, Trash2, Download, Clock } from "lucide-react";

interface Note {
    id: string;
    text: string;
    timestamp: Date;
    duration?: number;
}

export default function Component() {
    const [notes, setNotes] = useState<Note[]>([
        {
            id: "1",
            text: "Meeting with the development team to discuss the new features for the upcoming release. We need to prioritize the user authentication system and the dashboard improvements.",
            timestamp: new Date(Date.now() - 300000), // 5 minutes ago
            duration: 45,
        },
        {
            id: "2",
            text: "Remember to follow up with the client about the project timeline. They mentioned wanting to see a demo by next Friday.",
            timestamp: new Date(Date.now() - 600000), // 10 minutes ago
            duration: 23,
        },
        {
            id: "3",
            text: "Ideas for the presentation: focus on user experience improvements, show before and after comparisons, include performance metrics.",
            timestamp: new Date(Date.now() - 900000), // 15 minutes ago
            duration: 31,
        },
    ]);

    const [isListening, setIsListening] = useState(false);
    const [currentNote, setCurrentNote] = useState("");

    // Simulate receiving STT data
    useEffect(() => {
        if (isListening) {
            const interval = setInterval(() => {
                // Simulate receiving text chunks from STT
                const sampleTexts = [
                    "This is a sample transcription from the STT device.",
                    "Another piece of transcribed text coming through.",
                    "The speech-to-text system is working correctly.",
                    "Recording important meeting notes automatically.",
                ];

                const randomText =
                    sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
                setCurrentNote((prev) => prev + " " + randomText);
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [isListening]);

    const toggleListening = () => {
        if (isListening && currentNote.trim()) {
            // Save the current note
            const newNote: Note = {
                id: Date.now().toString(),
                text: currentNote.trim(),
                timestamp: new Date(),
                duration: Math.floor(Math.random() * 60) + 10,
            };
            setNotes((prev) => [newNote, ...prev]);
            setCurrentNote("");
        }
        setIsListening(!isListening);
    };

    const deleteNote = (id: string) => {
        setNotes((prev) => prev.filter((note) => note.id !== id));
    };

    const clearAllNotes = () => {
        setNotes([]);
    };

    const exportNotes = () => {
        const notesText = notes
            .map((note) => `[${note.timestamp.toLocaleString()}] ${note.text}`)
            .join("\n\n");

        const blob = new Blob([notesText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `notes-${new Date().toISOString().split("T")[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <PenTool className="w-8 h-8 text-gray-700" />
                    <h1 className="text-3xl font-bold text-gray-800">
                        Live Notes Dashboard
                    </h1>
                </div>

                <div className="flex items-center gap-3">
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
                {/* STT Control Panel */}
                <Card className="mb-6 bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mic className="w-5 h-5" />
                            Speech-to-Text Control
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={toggleListening}
                                variant={
                                    isListening ? "destructive" : "default"
                                }
                                size="lg"
                            >
                                {isListening ? (
                                    <>
                                        <MicOff className="w-4 h-4 mr-2" />
                                        Stop Recording
                                    </>
                                ) : (
                                    <>
                                        <Mic className="w-4 h-4 mr-2" />
                                        Start Recording
                                    </>
                                )}
                            </Button>

                            {isListening && (
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm text-gray-600">
                                        Recording...
                                    </span>
                                </div>
                            )}
                        </div>

                        {currentNote && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700">
                                    <strong>Current transcription:</strong>{" "}
                                    {currentNote}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Notes Display */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Live Notes
                        </h2>
                        <Badge variant="secondary" className="text-sm">
                            {notes.length}{" "}
                            {notes.length === 1 ? "note" : "notes"}
                        </Badge>
                    </div>

                    {notes.length === 0 ? (
                        <Card className="bg-white">
                            <CardContent className="py-12 text-center">
                                <Mic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">
                                    No notes yet. Start recording to capture
                                    your first note!
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
                                                {note.duration && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {note.duration}s
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
        </div>
    );
}
