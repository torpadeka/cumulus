"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Trophy, Star, Target, Calendar, Award } from "lucide-react";

interface ProfileViewProps {
    user: any;
    stats: {
        completedLessons: number;
        averageScore: number;
        overallProgress: number;
        totalLessons: number;
    };
    onBack: () => void;
}

export default function ProfileView({ user, stats, onBack }: ProfileViewProps) {
    const achievements = [
        {
            id: 1,
            title: "First Steps",
            description: "Complete your first lesson",
            icon: <Star className="w-6 h-6" />,
            earned: stats.completedLessons >= 1,
            date: "2024-01-15",
        },
        {
            id: 2,
            title: "Alphabet Master",
            description: "Complete all alphabet lessons",
            icon: <Award className="w-6 h-6" />,
            earned: stats.completedLessons >= 3,
            date: stats.completedLessons >= 3 ? "2024-01-20" : null,
        },
        {
            id: 3,
            title: "Perfect Score",
            description: "Get 100% on any lesson",
            icon: <Trophy className="w-6 h-6" />,
            earned: stats.averageScore >= 95,
            date: stats.averageScore >= 95 ? "2024-01-18" : null,
        },
        {
            id: 4,
            title: "Dedicated Learner",
            description: "Complete 5 lessons",
            icon: <Target className="w-6 h-6" />,
            earned: stats.completedLessons >= 5,
            date: null,
        },
    ];

    const earnedAchievements = achievements.filter((a) => a.earned);
    const upcomingAchievements = achievements.filter((a) => !a.earned);

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
                            Your Profile
                        </h1>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* User Info */}
                <Card className="bg-white shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-lg">
                                    {user.username.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-xl">{user.username}</h2>
                                <p className="text-gray-600 text-sm">
                                    {user.email}
                                </p>
                            </div>
                        </CardTitle>
                    </CardHeader>
                </Card>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <CardContent className="py-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold mb-2">
                                    {stats.completedLessons}
                                </div>
                                <div className="text-green-100">
                                    Lessons Completed
                                </div>
                                <Progress
                                    value={stats.overallProgress}
                                    className="mt-3 bg-green-400"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardContent className="py-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold mb-2">
                                    {stats.averageScore}%
                                </div>
                                <div className="text-blue-100">
                                    Average Score
                                </div>
                                <div className="flex justify-center mt-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-4 h-4 ${
                                                star <=
                                                Math.floor(
                                                    stats.averageScore / 20
                                                )
                                                    ? "text-yellow-300 fill-current"
                                                    : "text-blue-300"
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <CardContent className="py-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold mb-2">
                                    {earnedAchievements.length}
                                </div>
                                <div className="text-purple-100">
                                    Achievements
                                </div>
                                <Badge className="mt-3 bg-purple-400 text-purple-100">
                                    {earnedAchievements.length}/
                                    {achievements.length}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Achievements */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Earned Achievements */}
                    <Card className="bg-white shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                Earned Achievements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {earnedAchievements.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">
                                    No achievements earned yet. Keep learning!
                                </p>
                            ) : (
                                earnedAchievements.map((achievement) => (
                                    <div
                                        key={achievement.id}
                                        className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg"
                                    >
                                        <div className="text-yellow-600">
                                            {achievement.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-yellow-800">
                                                {achievement.title}
                                            </h4>
                                            <p className="text-sm text-yellow-700">
                                                {achievement.description}
                                            </p>
                                            {achievement.date && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Calendar className="w-3 h-3 text-yellow-600" />
                                                    <span className="text-xs text-yellow-600">
                                                        {achievement.date}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Upcoming Achievements */}
                    <Card className="bg-white shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-gray-500" />
                                Upcoming Achievements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {upcomingAchievements.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">
                                    All achievements unlocked! 🎉
                                </p>
                            ) : (
                                upcomingAchievements.map((achievement) => (
                                    <div
                                        key={achievement.id}
                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="text-gray-400">
                                            {achievement.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-700">
                                                {achievement.title}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                {achievement.description}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Learning Progress */}
                <Card className="bg-white shadow-lg">
                    <CardHeader>
                        <CardTitle>Learning Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Overall Progress</span>
                                    <span>{stats.overallProgress}%</span>
                                </div>
                                <Progress
                                    value={stats.overallProgress}
                                    className="h-3"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {stats.completedLessons}
                                    </div>
                                    <div className="text-sm text-blue-800">
                                        Completed
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-600">
                                        {stats.totalLessons -
                                            stats.completedLessons}
                                    </div>
                                    <div className="text-sm text-gray-800">
                                        Remaining
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
