"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { CameraIcon, CameraOffIcon } from "lucide-react";

interface WebcamCaptureProps {
    onTextExtracted: (text: string) => void;
    addDebugMessage: (message: string) => void;
    onError?: (error: string | null) => void;
}

export function WebcamCapture({
    onTextExtracted,
    addDebugMessage,
    onError,
}: WebcamCaptureProps) {
    const webcamRef = useRef<Webcam>(null);
    const processInterval = useRef<NodeJS.Timeout | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); // Prevent overlapping requests

    const startCamera = useCallback(async () => {
        addDebugMessage("Attempting to start camera");
        setIsCameraActive(true); // Set to true immediately
        addDebugMessage(`isCameraActive set to: ${isCameraActive}`); // Log initial state
        setError(null);

        try {
            const permissionStatus = await navigator.permissions.query({
                name: "camera" as PermissionName,
            });
            addDebugMessage(
                `Camera permission state: ${permissionStatus.state}`
            );
            if (permissionStatus.state === "denied") {
                throw new Error(
                    "Camera permission denied. Please enable camera access in your browser settings."
                );
            }

            if (
                webcamRef.current &&
                webcamRef.current.video &&
                webcamRef.current.video?.readyState >= 3
            ) {
                setIsCameraActive(true);
                setError(null);
            } else {
                addDebugMessage(
                    "webcamRef is not ready. Delaying interval setup."
                );
                setTimeout(startCamera, 500); // Retry after delay
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : String(err);
            setError(`Could not access camera: ${errorMessage}`);
            addDebugMessage(`Camera error: ${errorMessage}`);
            setIsCameraActive(false); // Reset on error
            if (onError) onError(errorMessage);
        }
    }, [addDebugMessage, onError]);

    const stopCamera = useCallback(() => {
        addDebugMessage("Stopping camera");
        if (webcamRef.current && webcamRef.current.stream) {
            const stream = webcamRef.current.stream;
            stream.getTracks().forEach((track) => track.stop());
            addDebugMessage("Camera stream stopped");
        }
        if (processInterval.current) {
            clearInterval(processInterval.current);
            processInterval.current = null;
            addDebugMessage("OCR processing interval cleared");
        }
        setIsCameraActive(false);
        setError(null);
    }, [addDebugMessage]);

    useEffect(() => {
        addDebugMessage("WebcamCapture component mounting...");
        setIsMounted(true);

        return () => {
            addDebugMessage("Cleaning up camera on unmount");
            stopCamera();
        };
    }, [addDebugMessage, stopCamera]);

    const processFrameForOCR = useCallback(async () => {
        if (isProcessing) {
            addDebugMessage("Previous OCR request still processing, skipping");
            return;
        }
        setIsProcessing(true);
        addDebugMessage("Entering processFrameForOCR");
        addDebugMessage(`isCameraActive during OCR: ${isCameraActive}`); // Log state during OCR
        if (!webcamRef.current) {
            addDebugMessage("webcamRef.current is null, skipping OCR");
            setIsProcessing(false);
            return;
        }
        if (!isCameraActive) {
            addDebugMessage("Camera is not active, skipping OCR");
            setIsProcessing(false);
            return;
        }

        try {
            addDebugMessage("Attempting to capture screenshot");
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) {
                addDebugMessage("Failed to capture screenshot from webcam");
                setIsProcessing(false);
                return;
            }
            addDebugMessage("Screenshot captured successfully");

            const response = await fetch(imageSrc);
            const blob = await response.blob();
            addDebugMessage("Blob created from screenshot");

            console.log("Sending OCR request to /api/ocr"); // Added browser console log
            addDebugMessage("Sending request to /api/ocr");
            const ocrResponse = await fetch("/api/ocr", {
                method: "POST",
                body: blob,
            });

            addDebugMessage(`API response status: ${ocrResponse.status}`);
            if (!ocrResponse.ok) {
                const errorData = await ocrResponse.json();
                throw new Error(
                    errorData.error || "Failed to process OCR request"
                );
            }

            const result = await ocrResponse.json();
            addDebugMessage(`Raw OCR API response: ${JSON.stringify(result)}`);
            const extractedText = result.text || "No text detected...";
            addDebugMessage(`Extracted text: ${extractedText.slice(0, 50)}...`);
            onTextExtracted(extractedText);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : String(err);
            addDebugMessage(`Error processing frame with OCR: ${errorMessage}`);
            onTextExtracted(`Error: ${errorMessage}`);
        } finally {
            setIsProcessing(false);
        }
    }, [isCameraActive, onTextExtracted, addDebugMessage, isProcessing]);

    if (!isMounted) {
        return (
            <div className="space-y-4">
                <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video min-h-[200px]">
                    <div className="absolute inset-0 flex items-center justify-center text-center p-8">
                        <div>
                            <CameraIcon
                                size={48}
                                className="mx-auto mb-4 text-gray-400"
                            />
                            <p className="text-gray-500">
                                Camera is inactive. Click 'Start Camera' to
                                begin.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="w-full flex justify-end">
                    <Button
                        className="bg-[#0078D4] hover:bg-[#0063B1] flex items-center"
                        onClick={() => {
                            addDebugMessage(
                                "Start button clicked, waiting for mount"
                            );
                        }}
                        disabled
                    >
                        <CameraIcon size={16} className="mr-2" />
                        Start Camera
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video min-h-[200px]">
                {isCameraActive && !error ? (
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                            facingMode: "environment",
                        }}
                        className="w-full h-full object-contain"
                        onUserMedia={() => {
                            addDebugMessage("Webcam stream active");

                            // Start OCR interval after confirming the webcam is streaming
                            if (!processInterval.current) {
                                addDebugMessage(
                                    "Starting OCR interval after webcam is active"
                                );
                                processInterval.current = setInterval(() => {
                                    processFrameForOCR();
                                }, 2000);
                            }
                        }}
                        onUserMediaError={(err) => {
                            const errorMessage = String(err);
                            setError(
                                `Could not access camera: ${errorMessage}`
                            );
                            addDebugMessage(`Camera error: ${errorMessage}`);
                            if (onError) onError(errorMessage);
                            setIsCameraActive(false);
                        }}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-center p-8">
                        <div>
                            <CameraIcon
                                size={48}
                                className="mx-auto mb-4 text-gray-400"
                            />
                            <p className="text-gray-500">
                                Camera is inactive. Click 'Start Camera' to
                                begin.
                            </p>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white p-2 text-sm">
                        {error}
                    </div>
                )}
            </div>
            <div className="w-full flex justify-end">
                {isCameraActive ? (
                    <Button
                        variant="destructive"
                        onClick={stopCamera}
                        className="flex items-center"
                    >
                        <CameraOffIcon size={16} className="mr-2" />
                        Stop Camera
                    </Button>
                ) : (
                    <Button
                        className="bg-[#0078D4] hover:bg-[#0063B1] flex items-center"
                        onClick={startCamera}
                    >
                        <CameraIcon size={16} className="mr-2" />
                        Start Camera
                    </Button>
                )}
            </div>
        </div>
    );
}
