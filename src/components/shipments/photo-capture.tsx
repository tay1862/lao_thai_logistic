'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface PhotoCaptureProps {
    onPhotosChange: (urls: string[]) => void;
    maxPhotos?: number;
}

export function PhotoCapture({ onPhotosChange, maxPhotos = 3 }: PhotoCaptureProps) {
    const [photos, setPhotos] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files.length > 0) {
            await uploadFile(e.target.files[0]);
        }
    }

    async function uploadFile(file: File) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (data.success) {
                const newPhotos = [...photos, data.url];
                setPhotos(newPhotos);
                onPhotosChange(newPhotos);
                toast.success('ອັບໂຫຼດຮູບພາບສຳເລັດ');
            } else {
                toast.error('ອັບໂຫຼດບໍ່ສຳເລັດ');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('ເກີດຂໍ້ຜິດພາດໃນການອັບໂຫຼດ');
        }
        setIsUploading(false);
    }

    function removePhoto(index: number) {
        const newPhotos = photos.filter((_, i) => i !== index);
        setPhotos(newPhotos);
        onPhotosChange(newPhotos);
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
                {photos.map((url, index) => (
                    <div key={index} className="relative w-24 h-24 border rounded-lg overflow-hidden group">
                        <Image
                            src={url}
                            alt={`Uploaded ${index + 1}`}
                            fill
                            className="object-cover"
                        />
                        <button
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>

            {photos.length < maxPhotos && (
                <div className="flex gap-2">
                    <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Camera className="w-4 h-4 mr-2" />
                        )}
                        ຖ່າຍຮູບ / ອັບໂຫຼດ
                    </Button>
                </div>
            )}
        </div>
    );
}
