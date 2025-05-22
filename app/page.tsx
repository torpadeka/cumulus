"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback, useReducer } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    MicIcon,
    SparklesIcon,
    SendIcon,
    SettingsIcon,
    MicOffIcon,
    PlayIcon,
    MoveIcon,
} from "lucide-react";
import { WebcamCapture } from "@/components/webcam-capture";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

interface Message {
    role: "user" | "assistant";
    content: string;
}

type Action = { type: "FORCE_UPDATE" } | { type: "SET_TEXT"; payload: string };

function reducer(state: number, action: Action): number {
    switch (action.type) {
        case "FORCE_UPDATE":
            return state + 1;
        case "SET_TEXT":
            return state + 1;
        default:
            return state;
    }
}

export default function Home() {
    // Webcam state
    const [webcamActive, setWebcamActive] = useState(false);
    const [extractedText, setExtractedText] = useState("");
    const [cameraError, setCameraError] = useState<string | null>(null);

    // Speech recognition state
    const [micActive, setMicActive] = useState(false);
    const [speechText, setSpeechText] = useState("");
    const [speechError, setSpeechError] = useState<string | null>(null);
    const recognizerRef = useRef<sdk.SpeechRecognizer | null>(null);

    // Summary state
    const [summaryText, setSummaryText] = useState("");
    const [audioData, setAudioData] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Chat state
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content:
                "Hello! I'm Cumulus, your AI assistant. I can see through your camera, listen to your voice, and help answer your questions. How can I assist you today?",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Settings state
    const [voice, setVoice] = useState("en-US-JennyNeural");
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(150);
    const [voiceSuccess, setVoiceSuccess] = useState(false);
    const [aiSuccess, setAiSuccess] = useState(false);

    // Debug state
    const [showDebug, setShowDebug] = useState(false);
    const [debugMessages, setDebugMessages] = useState<string[]>([]);

    // Draggable button state
    const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const buttonRef = useRef<HTMLButtonElement>(null);

    // Add debug message
    const addDebugMessage = useCallback((message: string) => {
        console.log("addDebugMessage called with:", message);
        const timestamp = new Date().toLocaleTimeString();
        setDebugMessages((prev) => [
            ...prev.slice(-19),
            `[${timestamp}] ${message}`,
        ]);
    }, []);

    // Save OCR text to file
    const saveOcrToFile = async (text: string) => {
        try {
            const response = await fetch("/api/save-ocr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            const data = await response.json();
            addDebugMessage(data.message);
        } catch (error) {
            addDebugMessage(`Error saving OCR: ${error}`);
        }
    };

    // Save STT text to file
    const saveSttToFile = async (text: string) => {
        try {
            const response = await fetch("/api/save-stt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            const data = await response.json();
            addDebugMessage(data.message);
        } catch (error) {
            addDebugMessage(`Error saving STT: ${error}`);
        }
    };

    // Log extractedText changes and force update
    useEffect(() => {
        addDebugMessage(
            `Rendering with extractedText: ${extractedText.slice(0, 50)}...`
        );
    }, [extractedText, addDebugMessage]);

    // Modified setExtractedText to include logging
    const handleTextExtracted = useCallback(
        (text: string) => {
            addDebugMessage(
                `handleTextExtracted called with: ${text.slice(0, 50)}`
            );
            setExtractedText(text);
            if (text && text.trim() !== "No text detected") {
                saveOcrToFile(text);
            }
        },
        [addDebugMessage, extractedText]
    );

    useEffect(() => {
        setButtonPosition({
            x: window.innerWidth - 80,
            y: window.innerHeight - 120,
        });
        console.log("Logging Home component mounted to browser console");
        addDebugMessage("Home component mounted");
    }, [addDebugMessage]);

    useEffect(() => {
        addDebugMessage(`webcamActive changed to: ${webcamActive}`);
    }, [webcamActive, addDebugMessage]);

    // Azure Speech SDK integration for STT
    const startSpeechRecognition = async () => {
        try {
            const speechConfig = sdk.SpeechConfig.fromSubscription(
                process.env.NEXT_PUBLIC_SPEECH_KEY!,
                process.env.NEXT_PUBLIC_SPEECH_REGION!
            );
            speechConfig.speechRecognitionLanguage = "id-ID";

            const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
            recognizerRef.current = new sdk.SpeechRecognizer(
                speechConfig,
                audioConfig
            );

            recognizerRef.current.recognizing = (
                _s: sdk.Recognizer,
                e: sdk.SpeechRecognitionEventArgs
            ) => {
                if (e.result.text) {
                    setSpeechText((prev) =>
                        prev ? `${prev}\n${e.result.text}` : e.result.text
                    );
                }
            };

            recognizerRef.current.recognized = (
                _s: sdk.Recognizer,
                e: sdk.SpeechRecognitionEventArgs
            ) => {
                if (e.result.text) {
                    setSpeechText((prev) =>
                        prev ? `${prev}\n${e.result.text}` : e.result.text
                    );
                    addDebugMessage(`Recognized speech: ${e.result.text}`);
                    if (e.result.text.trim().endsWith(".")) {
                        saveSttToFile(e.result.text.trim());
                    }
                }
            };
            recognizerRef.current.canceled = (s, e) => {
                const reason = e.reason || "Unknown error";
                setSpeechError(`Speech recognition canceled: ${reason}`);
                addDebugMessage(`Speech recognition canceled: ${reason}`);
                setMicActive(false);
            };

            recognizerRef.current.sessionStopped = () => {
                addDebugMessage("Speech recognition session stopped");
                setMicActive(false);
            };

            recognizerRef.current.startContinuousRecognitionAsync(
                () => {
                    setMicActive(true);
                    setSpeechError(null);
                    addDebugMessage("Speech recognition started");
                },
                (err: unknown) => {
                    setSpeechError(
                        `Failed to start speech recognition: ${err}`
                    );
                    addDebugMessage(`Speech recognition error: ${err}`);
                    setMicActive(false);
                }
            );
        } catch (err) {
            setSpeechError(`Could not start speech recognition: ${err}`);
            addDebugMessage(`Speech recognition error: ${err}`);
            setMicActive(false);
        }
    };

    const stopSpeechRecognition = () => {
        if (recognizerRef.current) {
            recognizerRef.current.stopContinuousRecognitionAsync(
                () => {
                    setMicActive(false);
                    addDebugMessage("Speech recognition stopped");
                },
                (err: unknown) => {
                    setSpeechError(`Failed to stop speech recognition: ${err}`);
                    addDebugMessage(`Speech recognition error: ${err}`);
                }
            );
            recognizerRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            if (recognizerRef.current) {
                stopSpeechRecognition();
            }
        };
    }, []);

    // Play audio
    const playAudio = () => {
        setIsPlaying(true);
        setTimeout(() => setIsPlaying(false), 3000);
    };

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch OCR text from file
    const fetchOcrText = async (): Promise<string> => {
        try {
            const response = await fetch("/api/get-ocr", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            const data = await response.json();
            return data.text || "";
        } catch (error) {
            addDebugMessage(`Error fetching OCR text: ${error}`);
            return "";
        }
    };

    // Fetch STT text from file
    const fetchSttText = async (): Promise<string> => {
        try {
            const response = await fetch("/api/get-stt", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            const data = await response.json();
            return data.text || "";
        } catch (error) {
            addDebugMessage(`Error fetching STT text: ${error}`);
            return "";
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        // Add the user's message to the chat
        setMessages((prev) => [...prev, { role: "user", content: input }]);
        setInput("");
        setIsLoading(true);

        try {
            // Step 1: Fetch OCR and STT data
            const ocrText = await fetchOcrText();
            const sttText = await fetchSttText();

            // Step 2: Define predefined prompts
            const cumulusPrompt =
                "Anda adalah chatbot Cumulus, sebuah platform pembelajaran guru-siswa yang membaca teks papan tulis dengan OCR secara langsung, dan mendengar perkataan guru yang diubah menjadi teks dengan Speech-to-Text. Tugas anda adalah untuk menggunakan kedua data ini sebagai konteks untuk menjawab pertanyaan murid. Ketika merespon, jangan katakan 'saya akan membantu' atau pembuka yang terlalu bertele-tele dan tidak berhubungan dan langsung menjawab prompt dari murid tanpa membahas atau memberitahu isi dari data OCR maupun STT. Berikut adalah data yang tersedia:";
            const ocrPrompt = ocrText
                ? `Ini adalah teks hasil dari kamera (OCR): "${ocrText}"`
                : "Ini adalah teks hasil dari kamera (OCR): Belum ada hasil teks";
            const sttPrompt = sttText
                ? `Ini adalah teks dari perkataan guru (STT): "${sttText}"`
                : "Ini adalah teks dari perkataan guru (STT): Belum ada hasil teks";
            const userPrompt = `Murid menanyakan hal ini: "${input}". Tolong respon sebagai assistant murid tersebut, dengan menggunakan data OCR dan STT tersebut sebagai konteks untuk merespon.`;

            // Step 3: Combine all prompts into a single string
            const combinedPrompt = `${cumulusPrompt}\n\n${ocrPrompt}\n\n${sttPrompt}\n\n${userPrompt}`;

            // Step 4: Call Azure OpenAI API
            const response = await fetch("/api/gpt", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: combinedPrompt,
                }),
            });

            const data = await response.json();

            if (response.ok && data.response) {
                const gptResponse = data.response;
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: gptResponse },
                ]);
                addDebugMessage("Successfully received response from GPT");
            } else {
                throw new Error(
                    data.error?.message || "Failed to get response from GPT"
                );
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        "I'm sorry, I encountered an error processing your request. Please try again.",
                },
            ]);
            addDebugMessage(`Error in handleSendMessage: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Save settings
    const handleVoiceSubmit = () => {
        setVoiceSuccess(true);
        addDebugMessage(`Voice set to ${voice}`);
        setTimeout(() => setVoiceSuccess(false), 3000);
    };

    const handleAISubmit = () => {
        setAiSuccess(true);
        addDebugMessage(
            `AI settings updated: Temperature=${temperature}, Max Tokens=${maxTokens}`
        );
        setTimeout(() => setAiSuccess(false), 3000);
    };

    // Draggable button handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
            setIsDragging(true);
            addDebugMessage("Started dragging settings button");
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            const buttonWidth = buttonRef.current?.offsetWidth || 50;
            const buttonHeight = buttonRef.current?.offsetHeight || 50;
            const boundedX = Math.max(
                0,
                Math.min(window.innerWidth - buttonWidth, newX)
            );
            const boundedY = Math.max(
                0,
                Math.min(window.innerHeight - buttonHeight, newY)
            );
            setButtonPosition({ x: boundedX, y: boundedY });
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
            addDebugMessage(
                `Moved settings button to position: x=${Math.round(
                    buttonPosition.x
                )}, y=${Math.round(buttonPosition.y)}`
            );
        }
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    useEffect(() => {
        const handleResize = () => {
            setButtonPosition((prev) => {
                const buttonWidth = buttonRef.current?.offsetWidth || 50;
                const buttonHeight = buttonRef.current?.offsetHeight || 50;
                return {
                    x: Math.min(prev.x, window.innerWidth - buttonWidth),
                    y: Math.min(prev.y, window.innerHeight - buttonHeight),
                };
            });
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className="bg-white">
            <Header />
            <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/2 border-r border-gray-200 p-4">
                    <h2 className="text-xl font-semibold text-[#0078D4] mb-4">
                        Camera Feed
                    </h2>
                    <div className="flex flex-col">
                        <WebcamCapture
                            onTextExtracted={handleTextExtracted}
                            addDebugMessage={addDebugMessage}
                            onError={(err) => {
                                setCameraError(err);
                            }}
                        />
                        {cameraError && (
                            <div className="mt-2 text-red-500 text-sm">
                                {cameraError}
                            </div>
                        )}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-medium text-gray-700">
                                    OCR Results:
                                </h3>
                            </div>
                            <div
                                className="bg-gray-50 rounded-md p-3 border border-gray-200 overflow-y-auto font-mono text-xs text-black"
                                style={{ height: "200px" }}
                            >
                                {extractedText && extractedText.trim() ? (
                                    <div className="whitespace-pre-line">
                                        {extractedText}
                                    </div>
                                ) : (
                                    <p className="text-black">
                                        No text detected yet
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-medium text-gray-700">
                                    Speech Recognition:
                                </h3>
                                <div className="flex space-x-2">
                                    <Button
                                        onClick={
                                            micActive
                                                ? stopSpeechRecognition
                                                : startSpeechRecognition
                                        }
                                        className={
                                            micActive
                                                ? "bg-red-500 hover:bg-red-600"
                                                : "bg-[#0078D4] hover:bg-[#0063B1] flex items-center"
                                        }
                                    >
                                        {micActive ? (
                                            <>
                                                <MicOffIcon
                                                    size={16}
                                                    className="mr-2"
                                                />
                                                Stop Listening
                                            </>
                                        ) : (
                                            <>
                                                <MicIcon
                                                    size={16}
                                                    className="mr-2"
                                                />
                                                Start Listening
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                            {speechError && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm mb-2">
                                    {speechError}
                                </div>
                            )}
                            <div
                                className="bg-gray-50 rounded-md p-3 border border-gray-200 overflow-y-auto font-mono text-xs"
                                style={{ height: "200px" }}
                            >
                                {speechText ? (
                                    <div className="whitespace-pre-line text-black">
                                        {speechText}
                                    </div>
                                ) : (
                                    <p className="text-black">
                                        Waiting for speech input
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-full md:w-1/2 p-4 relative">
                    <h2 className="text-xl font-semibold text-[#0078D4] mb-4">
                        Chat
                    </h2>
                    <div
                        className="overflow-y-auto mb-4 border border-gray-100 rounded-md p-4"
                        style={{ height: "500px" }}
                    >
                        <div className="space-y-4">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`max-w-[90%] p-3 rounded-2xl ${
                                        message.role === "user"
                                            ? "ml-auto bg-[#50A0DC] text-white rounded-br-sm"
                                            : "mr-auto bg-gray-100 text-gray-800 rounded-bl-sm"
                                    }`}
                                >
                                    {message.content}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="mr-auto bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm max-w-[90%] p-3">
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
                                    e.preventDefault();
                                    handleSendMessage();
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
                    <Sheet>
                        <SheetTrigger asChild>
                            <button
                                ref={buttonRef}
                                onMouseDown={handleMouseDown}
                                style={{
                                    position: "fixed",
                                    left: `${buttonPosition.x}px`,
                                    top: `${buttonPosition.y}px`,
                                    cursor: isDragging ? "grabbing" : "grab",
                                    transition: isDragging
                                        ? "none"
                                        : "box-shadow 0.2s, transform 0.2s",
                                    transform: isDragging
                                        ? "scale(1.1)"
                                        : "scale(1)",
                                    zIndex: 50,
                                }}
                                className={`flex items-center justify-center bg-[#0078D4] text-white rounded-full p-3 shadow-lg hover:bg-[#0063B1] ${
                                    isDragging ? "shadow-xl" : ""
                                }`}
                            >
                                {isDragging ? (
                                    <MoveIcon size={24} />
                                ) : (
                                    <SettingsIcon size={24} />
                                )}
                            </button>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle className="text-[#0078D4]">
                                    Cumulus AI Assistant
                                </SheetTitle>
                                <SheetDescription>
                                    Configure settings and view additional
                                    information
                                </SheetDescription>
                            </SheetHeader>
                            <Tabs defaultValue="summary" className="mt-6">
                                <TabsList className="grid grid-cols-4 mb-4">
                                    <TabsTrigger value="summary">
                                        Summary
                                    </TabsTrigger>
                                    <TabsTrigger value="settings">
                                        Settings
                                    </TabsTrigger>
                                    <TabsTrigger value="debug">
                                        Debug
                                    </TabsTrigger>
                                    <TabsTrigger value="system">
                                        System
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent
                                    value="summary"
                                    className="space-y-4"
                                >
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium text-[#0078D4]">
                                            AI Summary
                                        </h3>
                                        <div
                                            className="bg-gray-50 rounded-md p-4 border border-gray-200 overflow-y-auto font-mono text-sm"
                                            style={{ minHeight: "150px" }}
                                        ></div>
                                        <div className="flex gap-2">
                                            {audioData && (
                                                <Button
                                                    onClick={playAudio}
                                                    variant="outline"
                                                    className="border-[#0078D4] text-[#0078D4]"
                                                    disabled={isPlaying}
                                                >
                                                    <PlayIcon
                                                        size={16}
                                                        className="mr-2"
                                                    />
                                                    {isPlaying
                                                        ? "Playing..."
                                                        : "Play Audio"}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent
                                    value="settings"
                                    className="space-y-6"
                                >
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium text-[#0078D4]">
                                            Voice Settings
                                        </h3>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                TTS Voice
                                            </label>
                                            <Select
                                                value={voice}
                                                onValueChange={setVoice}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a voice" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="en-US-JennyNeural">
                                                        en-US-JennyNeural
                                                    </SelectItem>
                                                    <SelectItem value="en-US-GuyNeural">
                                                        en-US-GuyNeural
                                                    </SelectItem>
                                                    <SelectItem value="en-GB-SoniaNeural">
                                                        en-GB-SoniaNeural
                                                    </SelectItem>
                                                    <SelectItem value="en-AU-NatashaNeural">
                                                        en-AU-NatashaNeural
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            onClick={handleVoiceSubmit}
                                            className="bg-[#0078D4] hover:bg-[#0063B1] w-full"
                                            disabled={voiceSuccess}
                                        >
                                            {voiceSuccess
                                                ? "Voice Updated ✓"
                                                : "Apply Voice Setting"}
                                        </Button>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium text-[#0078D4]">
                                            AI Settings
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <label className="text-sm font-medium">
                                                        AI Temperature:{" "}
                                                        {temperature.toFixed(1)}
                                                    </label>
                                                </div>
                                                <Slider
                                                    value={[temperature]}
                                                    min={0}
                                                    max={1}
                                                    step={0.1}
                                                    onValueChange={(value) =>
                                                        setTemperature(value[0])
                                                    }
                                                />
                                                <p className="text-xs text-gray-500">
                                                    Lower values produce more
                                                    focused responses. Higher
                                                    values produce more creative
                                                    responses.
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <label className="text-sm font-medium">
                                                        Max Tokens: {maxTokens}
                                                    </label>
                                                </div>
                                                <Slider
                                                    value={[maxTokens]}
                                                    min={50}
                                                    max={500}
                                                    step={50}
                                                    onValueChange={(value) =>
                                                        setMaxTokens(value[0])
                                                    }
                                                />
                                                <p className="text-xs text-gray-500">
                                                    Controls the maximum length
                                                    of AI-generated responses.
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleAISubmit}
                                            className="bg-[#0078D4] hover:bg-[#0063B1] w-full"
                                            disabled={aiSuccess}
                                        >
                                            {aiSuccess
                                                ? "AI Settings Updated ✓"
                                                : "Apply AI Settings"}
                                        </Button>
                                    </div>
                                </TabsContent>
                                <TabsContent
                                    value="debug"
                                    className="space-y-4"
                                >
                                    <div className="flex items-center space-x-2 mb-4">
                                        <Checkbox
                                            id="debug"
                                            checked={showDebug}
                                            onCheckedChange={(checked) =>
                                                setShowDebug(checked as boolean)
                                            }
                                        />
                                        <label
                                            htmlFor="debug"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Enable Debug Console
                                        </label>
                                    </div>
                                    <div
                                        className="bg-gray-900 text-gray-100 rounded-md p-4 font-mono text-xs overflow-y-auto"
                                        style={{ height: "300px" }}
                                    >
                                        {debugMessages.length > 0 ? (
                                            debugMessages.map(
                                                (message, index) => {
                                                    const parts =
                                                        message.split("]");
                                                    const timestamp =
                                                        parts[0].replace(
                                                            "[",
                                                            ""
                                                        );
                                                    const content = parts
                                                        .slice(1)
                                                        .join("]");
                                                    return (
                                                        <div
                                                            key={index}
                                                            className="mb-1"
                                                        >
                                                            <span className="text-[#00B7C3]">
                                                                {timestamp}
                                                            </span>
                                                            <span>
                                                                {content}
                                                            </span>
                                                        </div>
                                                    );
                                                }
                                            )
                                        ) : (
                                            <p className="text-gray-500 italic">
                                                No debug messages yet...
                                            </p>
                                        )}
                                    </div>
                                </TabsContent>
                                <TabsContent
                                    value="system"
                                    className="space-y-4"
                                >
                                    <h3 className="text-lg font-medium text-[#0078D4]">
                                        System Information
                                    </h3>
                                    <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                                        <div className="space-y-2">
                                            <div className="flex justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium">
                                                    Version:
                                                </span>
                                                <span>Cumulus AI v1.0.0</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium">
                                                    Azure Vision:
                                                </span>
                                                <span className="flex items-center">
                                                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                                    Connected
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium">
                                                    Azure Speech:
                                                </span>
                                                <span className="flex items-center">
                                                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                                    Connected
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-1">
                                                <span className="font-medium">
                                                    Azure OpenAI:
                                                </span>
                                                <span className="flex items-center">
                                                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                                    Connected
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </div>
    );
}
