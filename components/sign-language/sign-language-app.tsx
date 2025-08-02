"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    PenTool,
    User,
    LogOut,
    Home,
    Play,
    Camera,
    Trophy,
    BookOpen,
    Target,
    Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import LessonView from "./lesson-view";
import PracticeView from "./practice-view";
import TestView from "./test-view";
import ProfileView from "./profile-view";

interface UserType {
    id: string;
    username: string;
    email: string;
    deviceId?: string;
}

interface SignLanguageAppProps {
    user: UserType;
}

type ViewType = "home" | "lesson" | "practice" | "test" | "profile";

// Mock data for lessons
const lessons = [
    {
        id: 1,
        title: "Alphabet A-E",
        description:
            "Learn the first 5 letters of Indonesian Sign Language alphabet",
        difficulty: "Beginner",
        duration: "10 min",
        completed: true,
        score: 95,
        signs: ["A", "B", "C", "D", "E"],
    },
    {
        id: 2,
        title: "Alphabet F-J",
        description: "Continue with letters F through J",
        difficulty: "Beginner",
        duration: "10 min",
        completed: true,
        score: 88,
        signs: ["F", "G", "H", "I", "J"],
    },
    {
        id: 3,
        title: "Alphabet K-O",
        description: "Learn letters K through O",
        difficulty: "Beginner",
        duration: "10 min",
        completed: false,
        score: 0,
        signs: ["K", "L", "M", "N", "O"],
    },
    {
        id: 4,
        title: "Basic Greetings",
        description: "Common greeting signs in Indonesian Sign Language",
        difficulty: "Beginner",
        duration: "15 min",
        completed: false,
        score: 0,
        signs: ["Hello", "Good Morning", "Thank You", "Please", "Sorry"],
    },
    {
        id: 5,
        title: "Family Members",
        description: "Signs for family relationships",
        difficulty: "Intermediate",
        duration: "20 min",
        completed: false,
        score: 0,
        signs: ["Mother", "Father", "Sister", "Brother", "Grandmother"],
    },
];

export default function SignLanguageApp({ user }: SignLanguageAppProps) {
    const [currentView, setCurrentView] = useState<ViewType>("home");
    const [selectedLesson, setSelectedLesson] = useState<any>(null);
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const goToNotes = () => {
        router.push("/");
    };

    const startLesson = (lesson: any) => {
        setSelectedLesson(lesson);
        setCurrentView("lesson");
    };

    const startPractice = (lesson: any) => {
        setSelectedLesson(lesson);
        setCurrentView("practice");
    };

    const startTest = (lesson: any) => {
        setSelectedLesson(lesson);
        setCurrentView("test");
    };

    const goHome = () => {
        setCurrentView("home");
        setSelectedLesson(null);
    };

    // Calculate user stats
    const completedLessons = lessons.filter((l) => l.completed).length;
    const totalScore = lessons.reduce((sum, l) => sum + l.score, 0);
    const averageScore =
        completedLessons > 0 ? Math.round(totalScore / completedLessons) : 0;
    const overallProgress = Math.round(
        (completedLessons / lessons.length) * 100
    );

    if (currentView === "lesson" && selectedLesson) {
        return (
            <LessonView
                lesson={selectedLesson}
                onBack={goHome}
                onComplete={() => setCurrentView("home")}
            />
        );
    }

    if (currentView === "practice" && selectedLesson) {
        return (
            <PracticeView
                lesson={selectedLesson}
                onBack={goHome}
                onComplete={() => setCurrentView("home")}
            />
        );
    }

    if (currentView === "test" && selectedLesson) {
        return (
            <TestView
                lesson={selectedLesson}
                onBack={goHome}
                onComplete={() => setCurrentView("home")}
            />
        );
    }

    if (currentView === "profile") {
        return (
            <ProfileView
                user={user}
                stats={{
                    completedLessons,
                    averageScore,
                    overallProgress,
                    totalLessons: lessons.length,
                }}
                onBack={goHome}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
            {/* Header */}
            <div
                className="mb-8 p-6 -m-6"
                style={{ backgroundColor: "#005485" }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <PenTool className="w-8 h-8 text-white" />
                        <h1 className="text-3xl font-bold text-white">
                            Cumulus Sign Language
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 mr-4">
                            <User className="w-4 h-4 text-white" />
                            <span className="text-sm text-white">
                                {user.username}
                            </span>
                        </div>
                        <Button
                            onClick={goToNotes}
                            variant="outline"
                            size="sm"
                            className="border-white text-white hover:bg-white hover:text-blue-900 bg-transparent"
                        >
                            <Home className="w-4 h-4 mr-2" />
                            Notes
                        </Button>
                        <Button
                            onClick={() => setCurrentView("profile")}
                            variant="outline"
                            size="sm"
                            className="border-white text-white hover:bg-white hover:text-blue-900"
                        >
                            <User className="w-4 h-4 mr-2" />
                            Profile
                        </Button>
                        <Button
                            onClick={handleLogout}
                            variant="outline"
                            size="sm"
                            className="border-white text-white hover:bg-white hover:text-blue-900 bg-transparent"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto">
                {/* Progress Overview */}
                <Card className="mb-8 bg-white shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            Your Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-cyan-600 mb-2">
                                    {completedLessons}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Lessons Completed
                                </div>
                                <Progress
                                    value={overallProgress}
                                    className="mt-2"
                                />
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600 mb-2">
                                    {averageScore}%
                                </div>
                                <div className="text-sm text-gray-600">
                                    Average Score
                                </div>
                                <div className="flex justify-center mt-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-4 h-4 ${
                                                star <=
                                                Math.floor(averageScore / 20)
                                                    ? "text-yellow-400 fill-current"
                                                    : "text-gray-300"
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600 mb-2">
                                    {lessons.length - completedLessons}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Lessons Remaining
                                </div>
                                <Badge className="mt-2 bg-purple-100 text-purple-700">
                                    Keep Going!
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Lessons Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lessons.map((lesson) => (
                        <Card
                            key={lesson.id}
                            className={`bg-white shadow-lg hover:shadow-xl transition-shadow ${
                                lesson.completed
                                    ? "border-l-4 border-l-green-500"
                                    : "border-l-4 border-l-gray-300"
                            }`}
                        >
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">
                                        {lesson.title}
                                    </CardTitle>
                                    {lesson.completed && (
                                        <Badge className="bg-green-100 text-green-700">
                                            Completed
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600">
                                    {lesson.description}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">
                                            Difficulty: {lesson.difficulty}
                                        </span>
                                        <span className="text-gray-500">
                                            Duration: {lesson.duration}
                                        </span>
                                    </div>

                                    {lesson.completed && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">
                                                Score:
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="text-green-600 border-green-200"
                                            >
                                                {lesson.score}%
                                            </Badge>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-1">
                                        {lesson.signs
                                            .slice(0, 3)
                                            .map((sign, index) => (
                                                <Badge
                                                    key={index}
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    {sign}
                                                </Badge>
                                            ))}
                                        {lesson.signs.length > 3 && (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                +{lesson.signs.length - 3} more
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => startLesson(lesson)}
                                            className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                                            size="sm"
                                        >
                                            <BookOpen className="w-4 h-4 mr-2" />
                                            Learn
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                startPractice(lesson)
                                            }
                                            variant="outline"
                                            className="flex-1"
                                            size="sm"
                                            disabled={!lesson.completed}
                                        >
                                            <Play className="w-4 h-4 mr-2" />
                                            Practice
                                        </Button>
                                        <Button
                                            onClick={() => startTest(lesson)}
                                            variant="outline"
                                            className="flex-1"
                                            size="sm"
                                            disabled={!lesson.completed}
                                        >
                                            <Camera className="w-4 h-4 mr-2" />
                                            Test
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Coming Soon Section */}
                <Card className="mt-8 bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
                    <CardContent className="py-8 text-center">
                        <Target className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-purple-800 mb-2">
                            More Lessons Coming Soon!
                        </h3>
                        <p className="text-purple-600">
                            We're working on advanced lessons including numbers,
                            colors, emotions, and everyday conversations.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
