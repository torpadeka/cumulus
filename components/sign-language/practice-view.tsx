"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    ArrowLeft,
    RefreshCw,
    CheckCircle,
    X,
    Eye,
    EyeOff,
} from "lucide-react";

interface PracticeViewProps {
    lesson: any;
    onBack: () => void;
    onComplete: () => void;
}

export default function PracticeView({
    lesson,
    onBack,
    onComplete,
}: PracticeViewProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [answered, setAnswered] = useState(false);
    const [timeLeft, setTimeLeft] = useState(10);
    const [isActive, setIsActive] = useState(true);

    const questions = lesson.signs.map((sign: string) => ({
        question: `What sign is this?`,
        correctAnswer: sign,
        options: generateOptions(sign, lesson.signs),
    }));

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && timeLeft > 0 && !answered) {
            interval = setInterval(() => {
                setTimeLeft((timeLeft) => timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0 && !answered) {
            handleAnswer("");
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, answered]);

    function generateOptions(correct: string, allSigns: string[]) {
        const options = [correct];
        const otherSigns = allSigns.filter((s) => s !== correct);

        // Add 3 random wrong options
        while (options.length < 4 && otherSigns.length > 0) {
            const randomIndex = Math.floor(Math.random() * otherSigns.length);
            const randomSign = otherSigns.splice(randomIndex, 1)[0];
            options.push(randomSign);
        }

        // Shuffle options
        return options.sort(() => Math.random() - 0.5);
    }

    const handleAnswer = (selectedAnswer: string) => {
        if (answered) return;

        setAnswered(true);
        setIsActive(false);

        if (selectedAnswer === currentQuestion.correctAnswer) {
            setScore(score + 1);
        }

        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setAnswered(false);
                setShowAnswer(false);
                setTimeLeft(10);
                setIsActive(true);
            } else {
                // Practice completed
                onComplete();
            }
        }, 2000);
    };

    const resetPractice = () => {
        setCurrentQuestionIndex(0);
        setScore(0);
        setAnswered(false);
        setShowAnswer(false);
        setTimeLeft(10);
        setIsActive(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
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
                            Practice: {lesson.title}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4 text-white">
                        <div className="text-sm">
                            Score: {score}/{questions.length}
                        </div>
                        <div className="text-sm">Time: {timeLeft}s</div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Progress */}
                <Card className="mb-6">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                                Practice Progress
                            </span>
                            <span className="text-sm text-gray-500">
                                {Math.round(progress)}%
                            </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </CardContent>
                </Card>

                {/* Question Area */}
                <Card className="bg-white shadow-lg mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>
                                Question {currentQuestionIndex + 1} of{" "}
                                {questions.length}
                            </span>
                            <Button
                                onClick={() => setShowAnswer(!showAnswer)}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                {showAnswer ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                                {showAnswer ? "Hide" : "Show"} Answer
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Sign Display */}
                            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-32 h-32 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                        {showAnswer ? (
                                            <span className="text-2xl font-bold text-purple-700">
                                                {currentQuestion.correctAnswer}
                                            </span>
                                        ) : (
                                            <span className="text-lg text-purple-600">
                                                ?
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-600">
                                        {currentQuestion.question}
                                    </p>
                                </div>
                            </div>

                            {/* Answer Options */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg mb-4">
                                    Choose the correct sign:
                                </h3>
                                {currentQuestion.options.map(
                                    (option: string, index: number) => (
                                        <Button
                                            key={index}
                                            onClick={() => handleAnswer(option)}
                                            disabled={answered}
                                            variant="outline"
                                            className={`w-full justify-start text-left p-4 h-auto ${
                                                answered
                                                    ? option ===
                                                      currentQuestion.correctAnswer
                                                        ? "bg-green-100 border-green-500 text-green-700"
                                                        : "bg-red-100 border-red-500 text-red-700"
                                                    : "hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span>{option}</span>
                                                {answered &&
                                                    option ===
                                                        currentQuestion.correctAnswer && (
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    )}
                                                {answered &&
                                                    option !==
                                                        currentQuestion.correctAnswer && (
                                                        <X className="w-5 h-5 text-red-500" />
                                                    )}
                                            </div>
                                        </Button>
                                    )
                                )}
                            </div>
                        </div>

                        {answered && (
                            <div className="mt-6 p-4 rounded-lg bg-blue-50">
                                <p className="text-blue-800">
                                    {score === currentQuestionIndex + 1
                                        ? "Correct! "
                                        : "Incorrect. "}
                                    The answer is "
                                    {currentQuestion.correctAnswer}".
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Controls */}
                <Card>
                    <CardContent className="py-4">
                        <div className="flex justify-between items-center">
                            <Button
                                onClick={resetPractice}
                                variant="outline"
                                className="flex items-center gap-2 bg-transparent"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Restart Practice
                            </Button>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {Math.round(
                                        (score / questions.length) * 100
                                    )}
                                    %
                                </div>
                                <div className="text-sm text-gray-600">
                                    Current Score
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-sm text-gray-600">
                                    {currentQuestionIndex + 1} /{" "}
                                    {questions.length} questions
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
