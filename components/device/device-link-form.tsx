"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Smartphone, Cloud } from "lucide-react";

interface User {
    id: string;
    username: string;
    email: string;
    deviceId?: string;
}

interface DeviceLinkFormProps {
    user: User;
}

export default function DeviceLinkForm({ user }: DeviceLinkFormProps) {
    const [deviceId, setDeviceId] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!deviceId.trim()) {
            setError("Device ID is required");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/device/link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deviceId: deviceId.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                router.push("/");
                router.refresh();
            } else {
                setError(data.error || "Failed to link device");
            }
        } catch (error) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
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

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Cloud className="w-8 h-8 text-cyan-500" />
                        <h1 className="text-2xl font-bold text-gray-800">
                            Cumulus
                        </h1>
                    </div>
                    <CardTitle className="flex items-center justify-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        Link Your Device
                    </CardTitle>
                    <CardDescription>
                        Welcome, {user.username}! Please enter your IoT device
                        ID to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="deviceId">Device ID</Label>
                            <Input
                                id="deviceId"
                                type="text"
                                placeholder="Enter your IoT device ID"
                                value={deviceId}
                                onChange={(e) => setDeviceId(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <p className="text-xs text-gray-500">
                                This ID should be provided with your IoT device
                                documentation.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-cyan-500 hover:bg-cyan-600"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Linking Device...
                                </>
                            ) : (
                                "Link Device"
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="text-sm text-gray-600 hover:text-gray-800"
                        >
                            Sign out
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
