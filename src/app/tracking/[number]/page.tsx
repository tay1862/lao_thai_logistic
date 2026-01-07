'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Phone, MapPin, Clock, DollarSign, MessageCircle, AlertTriangle, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DirectionBadge } from '@/components/shipments/direction-badge';
import { StatusBadge } from '@/components/shipments/status-badge';
import { getTrackingInfo } from '@/lib/api-client';
import { TrackingResponse } from '@/types';
import { formatLAK, formatDateTime, STATUS_LABELS } from '@/lib/constants';

interface PageProps {
    params: Promise<{ number: string }>;
}

export default function TrackingResultPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [tracking, setTracking] = useState<TrackingResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTracking() {
            setIsLoading(true);
            setError(null);

            // Use real API only
            const result = await getTrackingInfo(resolvedParams.number);

            if (result.success && result.data) {
                setTracking(result.data);
            } else {
                setError(result.error || 'ບໍ່ພົບໝາຍເລກຕິດຕາມນີ້');
            }

            setIsLoading(false);
        }

        fetchTracking();
    }, [resolvedParams.number]);

    if (isLoading) {
        return <LoadingState />;
    }

    if (error || !tracking) {
        return <ErrorState error={error || 'ບໍ່ພົບຂໍ້ມູນ'} onBack={() => router.push('/')} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push('/')}
                            className="rounded-full"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">
                                {tracking.companyTracking}
                            </h1>
                            {tracking.thaiTracking && (
                                <p className="text-sm text-gray-500">TH: {tracking.thaiTracking}</p>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 space-y-6">
                {/* Direction & Status */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap gap-3"
                >
                    <DirectionBadge direction={tracking.direction} size="lg" />
                    <StatusBadge status={tracking.currentStatus} size="lg" />
                </motion.div>

                {/* Current Status Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="border-0 shadow-lg overflow-hidden">
                        <div className="gradient-primary p-6 text-white">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                    <Package className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-white/80">ສະຖານະປັດຈຸບັນ</p>
                                    <h2 className="text-xl font-bold">
                                        {STATUS_LABELS[tracking.currentStatus]}
                                    </h2>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-white/80 mt-4">
                                <Clock className="w-4 h-4" />
                                <span>
                                    ອັບເດດ: {tracking.events[0] && formatDateTime(tracking.events[0].createdAt)}
                                </span>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Receiver Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">ຜູ້ຮັບ</p>
                                    <p className="font-semibold">{tracking.receiverName}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Photos Section */}
                {tracking.photos && tracking.photos.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18 }}
                    >
                        <Card className="border-0 shadow-md">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Camera className="w-5 h-5 text-pink-500" />
                                    ຮູບພາບພັດສະດຸ
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4 overflow-x-auto pb-2">
                                    {tracking.photos.map((url, index) => (
                                        <div key={index} className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                            <a href={url} target="_blank" rel="noopener noreferrer">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={url}
                                                    alt={`Shipment Photo ${index + 1}`}
                                                    className="object-cover w-full h-full hover:scale-105 transition-transform"
                                                />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="border-0 shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-500" />
                                ປະຫວັດການຂົນສົ່ງ
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-0">
                                {tracking.events.map((event, index) => {
                                    const isFirst = index === 0;
                                    const isLast = index === tracking.events.length - 1;

                                    return (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.25 + index * 0.05 }}
                                            className="relative flex gap-4 py-4"
                                        >
                                            {/* Line */}
                                            {!isLast && (
                                                <div className="absolute left-[11px] top-12 bottom-0 w-0.5 bg-blue-100" />
                                            )}

                                            {/* Dot */}
                                            <div
                                                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center ${isFirst
                                                    ? 'bg-blue-500 shadow-glow'
                                                    : 'bg-green-500'
                                                    }`}
                                            >
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <h4 className={`font-semibold ${isFirst ? 'text-blue-600' : 'text-gray-700'}`}>
                                                    {STATUS_LABELS[event.status]}
                                                </h4>
                                                {event.location && (
                                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <MapPin className="w-3 h-3" />
                                                        {event.location}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDateTime(event.createdAt)}
                                                    {event.staffName && ` • ໂດຍ ${event.staffName}`}
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Charges */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="border-0 shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-green-500" />
                                ຄ່າໃຊ້ຈ່າຍ
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">ຄ່າຂົນສົ່ງຂ້າມແດນ</span>
                                    <span className="font-medium">{formatLAK(tracking.crossBorderFee)}</span>
                                </div>
                                {tracking.codAmount && tracking.codAmount > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">COD (ເກັບປາຍທາງ)</span>
                                        <span className="font-medium">{formatLAK(tracking.codAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center py-3 bg-blue-50 -mx-4 px-4 rounded-lg">
                                    <span className="font-semibold text-blue-700">ລວມທັງໝົດ</span>
                                    <span className="font-bold text-xl text-blue-700">{formatLAK(tracking.total)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Contact Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="pb-6"
                >
                    <Button
                        variant="outline"
                        className="w-full h-14 rounded-xl border-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        ຕິດຕໍ່ສອບຖາມກ່ຽວກັບພັດສະດຸນີ້
                    </Button>
                </motion.div>
            </main>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
            <div className="space-y-6">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-60 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
            </div>
        </div>
    );
}

function ErrorState({ error, onBack }: { error: string; onBack: () => void }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-0 shadow-xl">
                <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">ບໍ່ພົບຂໍ້ມູນ</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <Button onClick={onBack} className="gradient-primary">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        ກັບໄປໜ້າຫຼັກ
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
