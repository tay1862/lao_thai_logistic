'use client';

import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw, Check } from 'lucide-react';

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: 1280, height: 720 },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
            }
            setStream(mediaStream);
        } catch (err: any) {
            setError('ບໍ່ສາມາດເປີດກ້ອງໄດ້');
            console.error('Camera error:', err);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    }, [stream]);

    const capture = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageUrl);
        stopCamera();
    }, [stopCamera]);

    const retake = useCallback(() => {
        setCapturedImage(null);
        startCamera();
    }, [startCamera]);

    const confirm = useCallback(() => {
        if (!capturedImage || !canvasRef.current) return;

        canvasRef.current.toBlob(
            (blob) => {
                if (blob) {
                    const file = new File([blob], `photo_${Date.now()}.jpg`, {
                        type: 'image/jpeg',
                    });
                    onCapture(file);
                }
            },
            'image/jpeg',
            0.8
        );
    }, [capturedImage, onCapture]);

    const handleClose = useCallback(() => {
        stopCamera();
        onClose();
    }, [stopCamera, onClose]);

    // Start camera on mount
    useState(() => {
        startCamera();
    });

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50">
                <Button variant="ghost" size="icon" onClick={handleClose} className="text-white">
                    <X className="w-6 h-6" />
                </Button>
                <span className="text-white font-medium">ຖ່າຍຮູບ</span>
                <div className="w-10" />
            </div>

            {/* Camera/Preview */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
                {error ? (
                    <div className="text-center text-white p-8">
                        <p className="mb-4">{error}</p>
                        <Button onClick={startCamera}>ລອງໃໝ່</Button>
                    </div>
                ) : capturedImage ? (
                    <img
                        src={capturedImage}
                        alt="Captured"
                        className="max-w-full max-h-full object-contain"
                    />
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="max-w-full max-h-full object-contain"
                    />
                )}
            </div>

            {/* Controls */}
            <div className="p-6 bg-black/50 flex justify-center gap-8">
                {capturedImage ? (
                    <>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={retake}
                            className="rounded-full w-16 h-16"
                        >
                            <RotateCcw className="w-6 h-6" />
                        </Button>
                        <Button
                            size="lg"
                            onClick={confirm}
                            className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600"
                        >
                            <Check className="w-6 h-6" />
                        </Button>
                    </>
                ) : (
                    <Button
                        size="lg"
                        onClick={capture}
                        className="rounded-full w-20 h-20 bg-white hover:bg-gray-200"
                    >
                        <Camera className="w-8 h-8 text-black" />
                    </Button>
                )}
            </div>

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
