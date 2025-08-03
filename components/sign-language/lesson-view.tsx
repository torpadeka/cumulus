"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    ArrowLeft,
    ArrowRight,
    Play,
    Pause,
    RotateCcw,
    CheckCircle,
} from "lucide-react";

interface LessonViewProps {
    lesson: any;
    onBack: () => void;
    onComplete: () => void;
}

export default function LessonView({
    lesson,
    onBack,
    onComplete,
}: LessonViewProps) {
    const [currentSignIndex, setCurrentSignIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [completedSigns, setCompletedSigns] = useState<Set<number>>(
        new Set()
    );

    const currentSign = lesson.signs[currentSignIndex];
    const progress = ((currentSignIndex + 1) / lesson.signs.length) * 100;

    const nextSign = () => {
        if (currentSignIndex < lesson.signs.length - 1) {
            setCurrentSignIndex(currentSignIndex + 1);
            setIsPlaying(false);
        }
    };

    const prevSign = () => {
        if (currentSignIndex > 0) {
            setCurrentSignIndex(currentSignIndex - 1);
            setIsPlaying(false);
        }
    };

    const markAsLearned = () => {
        const newCompleted = new Set(completedSigns);
        newCompleted.add(currentSignIndex);
        setCompletedSigns(newCompleted);
    };

    const finishLesson = () => {
        // Mark lesson as completed
        onComplete();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
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
                            {lesson.title}
                        </h1>
                    </div>
                    <div className="text-white text-sm">
                        {currentSignIndex + 1} of {lesson.signs.length}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Progress Bar */}
                <Card className="mb-6">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                                Lesson Progress
                            </span>
                            <span className="text-sm text-gray-500">
                                {Math.round(progress)}%
                            </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </CardContent>
                </Card>

                {/* Main Learning Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Video/Animation Area */}
                    <Card className="bg-white shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Sign: "{currentSign}"</span>
                                {completedSigns.has(currentSignIndex) && (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                                <iframe
                                    src="https://www.youtube.com/embed/TuQj8aFOcgs"
                                    className="w-full h-full"
                                    allowFullScreen
                                />
                            </div>

                            {/* Video Controls */}
                            <div className="flex justify-center gap-2">
                                <Button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    {isPlaying ? (
                                        <Pause className="w-4 h-4" />
                                    ) : (
                                        <Play className="w-4 h-4" />
                                    )}
                                    {isPlaying ? "Pause" : "Play"}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2 bg-transparent"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Replay
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Instructions and Info */}
                    <Card className="bg-white shadow-lg">
                        <CardHeader>
                            <CardTitle>How to Sign "{currentSign}"</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-blue-800 mb-2">
                                    Instructions:
                                </h4>
                                <p className="text-blue-700 text-sm">
                                    {/* Mock instructions based on the sign */}
                                    {currentSign === "A" &&
                                        "Make a fist with your thumb on the side of your index finger."}
                                    {currentSign === "B" &&
                                        "Hold your hand up with fingers straight and thumb across your palm."}
                                    {currentSign === "C" &&
                                        "Curve your fingers and thumb to form the letter C shape."}
                                    {currentSign === "Hello" &&
                                        "Wave your hand with an open palm facing outward."}
                                    {currentSign === "Thank You" &&
                                        "Touch your chin with your fingertips and move your hand forward."}
                                    {![
                                        "A",
                                        "B",
                                        "C",
                                        "Hello",
                                        "Thank You",
                                    ].includes(currentSign) &&
                                        "Watch the video carefully and practice the hand movement shown."}
                                </p>
                            </div>

                            <div className="bg-green-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-green-800 mb-2">
                                    Tips:
                                </h4>
                                <ul className="text-green-700 text-sm space-y-1">
                                    <li>
                                        • Practice the movement slowly at first
                                    </li>
                                    <li>
                                        • Pay attention to hand shape and
                                        position
                                    </li>
                                    <li>
                                        • Repeat multiple times for muscle
                                        memory
                                    </li>
                                </ul>
                            </div>

                            <Button
                                onClick={markAsLearned}
                                className="w-full bg-green-500 hover:bg-green-600"
                                disabled={completedSigns.has(currentSignIndex)}
                            >
                                {completedSigns.has(currentSignIndex) ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Learned!
                                    </>
                                ) : (
                                    "Mark as Learned"
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Navigation */}
                <Card className="mt-6">
                    <CardContent className="py-4">
                        <div className="flex justify-between items-center">
                            <Button
                                onClick={prevSign}
                                variant="outline"
                                disabled={currentSignIndex === 0}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Previous
                            </Button>

                            <div className="flex gap-2">
                                {lesson.signs.map((_: any, index: number) => (
                                    <div
                                        key={index}
                                        className={`w-3 h-3 rounded-full ${
                                            index === currentSignIndex
                                                ? "bg-cyan-500"
                                                : completedSigns.has(index)
                                                ? "bg-green-500"
                                                : "bg-gray-300"
                                        }`}
                                    />
                                ))}
                            </div>

                            {currentSignIndex === lesson.signs.length - 1 ? (
                                <Button
                                    onClick={finishLesson}
                                    className="bg-green-500 hover:bg-green-600"
                                >
                                    Complete Lesson
                                    <CheckCircle className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={nextSign}
                                    disabled={
                                        currentSignIndex ===
                                        lesson.signs.length - 1
                                    }
                                >
                                    Next
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
