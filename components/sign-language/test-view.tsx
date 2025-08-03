"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    ArrowLeft,
    Camera,
    CameraOff,
    CheckCircle,
    X,
    RotateCcw,
} from "lucide-react";

interface TestViewProps {
    lesson: any;
    onBack: () => void;
    onComplete: () => void;
}

export default function TestView({
    lesson,
    onBack,
    onComplete,
}: TestViewProps) {
    const [currentTestIndex, setCurrentTestIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [testResults, setTestResults] = useState<boolean[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentResult, setCurrentResult] = useState<
        "correct" | "incorrect" | null
    >(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const currentSign = lesson.signs[currentTestIndex];
    const progress = ((currentTestIndex + 1) / lesson.signs.length) * 100;

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => {
                    track.stop();
                    console.log("Track stopped:", track);
                });
                streamRef.current = null;
            }
        };
    }, []);

    // Handle video stream assignment when camera is enabled
    useEffect(() => {
        if (cameraEnabled && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current
                .play()
                .then(() => console.log("Video playback started"))
                .catch((e) => console.error("Video play error:", e));
        }
    }, [cameraEnabled]);

    const enableCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 } },
            });
            console.log(
                "Stream active:",
                stream.active,
                stream.getVideoTracks()
            );
            streamRef.current = stream;
            setCameraEnabled(true);
        } catch (error: any) {
            console.error("Error accessing camera:", error.name, error.message);
            let errorMessage =
                "Unable to access camera. Please check permissions.";
            if (error.name === "NotFoundError") {
                errorMessage = "No camera found on this device.";
            } else if (error.name === "NotAllowedError") {
                errorMessage =
                    "Camera access denied. Please allow camera access in your browser settings.";
            }
            alert(errorMessage);
            setCameraEnabled(false);
        }
    };

    const disableCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                track.stop();
                console.log("Track stopped:", track);
            });
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraEnabled(false);
        setIsRecording(false);
    };

    const startRecording = () => {
        if (!cameraEnabled) {
            enableCamera();
            return;
        }
        setIsRecording(true);
        setCurrentResult(null);

        // Simulate recording for 3 seconds
        setTimeout(() => {
            setIsRecording(false);
            analyzeSign();
        }, 3000);
    };

    const analyzeSign = () => {
        setIsAnalyzing(true);

        // Simulate AI analysis (random result for demo)
        setTimeout(() => {
            const isCorrect = Math.random() > 0.3; // 70% chance of being correct
            const newResults = [...testResults];
            newResults[currentTestIndex] = isCorrect;
            setTestResults(newResults);
            setCurrentResult(isCorrect ? "correct" : "incorrect");

            if (isCorrect) {
                setScore(score + 1);
            }

            setIsAnalyzing(false);
        }, 2000);
    };

    const nextTest = () => {
        if (currentTestIndex < lesson.signs.length - 1) {
            setCurrentTestIndex(currentTestIndex + 1);
            setCurrentResult(null);
        } else {
            // Test completed
            disableCamera();
            onComplete();
        }
    };

    const retryCurrentTest = () => {
        setCurrentResult(null);
        const newResults = [...testResults];
        newResults[currentTestIndex] = false;
        setTestResults(newResults);
    };

    // Debug function to log stream and video state
    const logStreamState = () => {
        console.log(
            "Stream:",
            streamRef.current,
            "Active:",
            streamRef.current?.active
        );
        console.log("Video srcObject:", videoRef.current?.srcObject);
        console.log("Camera enabled:", cameraEnabled);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
            {/* Header */}
            <div
                className="mb-8 p-6 -m-6"
                style={{ backgroundColor: "#005485" }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={onBack}
                            variant="outline"
                            size="sm"
                            className="border-white text-white hover:bg-white hover:text-blue-900 bg-transparent"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold text-white">
                            Camera Test: {lesson.title}
                        </h1>
                    </div>
                    <div className="text-white text-sm">
                        Score: {score}/{lesson.signs.length}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Progress */}
                <Card className="mb-6">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                                Test Progress
                            </span>
                            <span className="text-sm text-gray-500">
                                {Math.round(progress)}%
                            </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </CardContent>
                </Card>

                {/* Test Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Camera Feed */}
                    <Card className="bg-white shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Your Camera</span>
                                <div className="flex items-center gap-2">
                                    {isRecording && (
                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                    )}
                                    {isRecording && (
                                        <span className="text-sm text-red-600">
                                            Recording...
                                        </span>
                                    )}
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative w-full h-64 bg-gray-900 rounded-lg overflow-hidden mb-4">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    style={{
                                        display: cameraEnabled
                                            ? "block"
                                            : "none",
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                    onError={(e) =>
                                        console.error("Video element error:", e)
                                    }
                                    onCanPlay={() =>
                                        console.log("Video can play")
                                    }
                                />
                                {!cameraEnabled && (
                                    <div className="w-full h-full flex items-center justify-center text-white">
                                        <div className="text-center">
                                            <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                            <p>Camera not enabled</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center gap-2">
                                {!cameraEnabled ? (
                                    <Button
                                        onClick={enableCamera}
                                        className="bg-green-500 hover:bg-green-600"
                                    >
                                        <Camera className="w-4 h-4 mr-2" />
                                        Enable Camera
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            onClick={startRecording}
                                            disabled={
                                                isRecording ||
                                                isAnalyzing ||
                                                currentResult !== null
                                            }
                                            className="bg-red-500 hover:bg-red-600"
                                        >
                                            <Camera className="w-4 h-4 mr-2" />
                                            {isRecording
                                                ? "Recording..."
                                                : "Start Test"}
                                        </Button>
                                        <Button
                                            onClick={disableCamera}
                                            variant="outline"
                                        >
                                            <CameraOff className="w-4 h-4 mr-2" />
                                            Disable
                                        </Button>
                                        <Button
                                            onClick={logStreamState}
                                            variant="outline"
                                        >
                                            Log Stream
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Instructions and Results */}
                    <Card className="bg-white shadow-lg">
                        <CardHeader>
                            <CardTitle>Sign: "{currentSign}"</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-blue-800 mb-2">
                                    Instructions:
                                </h4>
                                <ol className="text-blue-700 text-sm space-y-1">
                                    <li>1. Enable your camera</li>
                                    <li>
                                        2. Position yourself clearly in the
                                        frame
                                    </li>
                                    <li>
                                        3. Click "Start Test" and perform the
                                        sign for "{currentSign}"
                                    </li>
                                    <li>
                                        4. Hold the sign steady for 3 seconds
                                    </li>
                                </ol>
                            </div>

                            {isAnalyzing && (
                                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                                    <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                    <p className="text-yellow-800">
                                        Analyzing your sign...
                                    </p>
                                </div>
                            )}

                            {currentResult === "correct" && (
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 text-green-800">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-semibold">
                                            Correct!
                                        </span>
                                    </div>
                                    <p className="text-green-700 text-sm mt-1">
                                        Great job! Your sign for "{currentSign}"
                                        was recognized correctly.
                                    </p>
                                </div>
                            )}

                            {currentResult === "incorrect" && (
                                <div className="bg-red-50 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-800">
                                        <X className="w-5 h-5" />
                                        <span className="font-semibold">
                                            Try Again
                                        </span>
                                    </div>
                                    <p className="text-red-700 text-sm mt-1">
                                        The sign wasn't recognized correctly.
                                        Check your hand position and try again.
                                    </p>
                                </div>
                            )}

                            {currentResult && (
                                <div className="flex gap-2">
                                    {currentResult === "incorrect" && (
                                        <Button
                                            onClick={retryCurrentTest}
                                            variant="outline"
                                            className="flex-1 bg-transparent"
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            Retry
                                        </Button>
                                    )}
                                    <Button
                                        onClick={nextTest}
                                        className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                                    >
                                        {currentTestIndex ===
                                        lesson.signs.length - 1
                                            ? "Finish Test"
                                            : "Next Sign"}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Test Progress Indicators */}
                <Card className="mt-6">
                    <CardContent className="py-4">
                        <div className="flex justify-center gap-2">
                            {lesson.signs.map((_: any, index: number) => (
                                <div
                                    key={index}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                        index === currentTestIndex
                                            ? "bg-cyan-500 text-white"
                                            : testResults[index] === true
                                            ? "bg-green-500 text-white"
                                            : testResults[index] === false
                                            ? "bg-red-500 text-white"
                                            : "bg-gray-300 text-gray-600"
                                    }`}
                                >
                                    {index < currentTestIndex ? (
                                        testResults[index] ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <X className="w-4 h-4" />
                                        )
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
