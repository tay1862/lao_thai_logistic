'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Camera,
    Check,
    Loader2,
    Package,
    QrCode,
    Keyboard,
} from 'lucide-react';
import { createShipment } from '@/lib/api-client';
import { ShipmentDirection, ParcelType } from '@/types';

// Dynamic import for barcode scanner (client-side only)
const BarcodeScanner = dynamic(
    () => import('@/components/scanner/barcode-scanner').then((mod) => mod.BarcodeScanner),
    { ssr: false, loading: () => <div className="h-[300px] bg-gray-100 rounded-xl animate-pulse" /> }
);

export default function ScanPage() {
    const router = useRouter();
    const [mode, setMode] = useState<'scan' | 'manual'>('scan');
    const [thaiTracking, setThaiTracking] = useState('');
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [createdCount, setCreatedCount] = useState(0);

    const handleScan = useCallback((code: string) => {
        if (code === lastScanned) return; // Prevent duplicate scans

        setThaiTracking(code);
        setLastScanned(code);

        // Play beep sound
        try {
            const audio = new Audio('/beep.mp3');
            audio.play();
        } catch { }

        toast.success(`ສແກນໄດ້: ${code}`);
    }, [lastScanned]);

    const handleQuickCreate = async () => {
        if (!thaiTracking) {
            toast.error('ກະລຸນາສແກນ ຫຼື ໃສ່ເລກ Tracking');
            return;
        }

        setIsCreating(true);
        try {
            const result = await createShipment({
                thaiTracking,
                direction: ShipmentDirection.TH_TO_LA,
                parcelType: ParcelType.PACKAGE,
                weight: 1,
                receiverName: 'ລໍຖ້າຂໍ້ມູນ',
                receiverPhone: '-',
                crossBorderFee: 50000,
            });

            if (result.success) {
                toast.success(`ສ້າງພັດສະດຸສຳເລັດ: ${result.data?.companyTracking}`);
                setCreatedCount((c) => c + 1);
                setThaiTracking('');
                setLastScanned(null);
            } else {
                toast.error(result.error || 'ເກີດຂໍ້ຜິດພາດ');
            }
        } catch (error) {
            toast.error('ເກີດຂໍ້ຜິດພາດ');
        }
        setIsCreating(false);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-lg mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            </Link>
                            <div className="flex items-center gap-2">
                                <QrCode className="w-5 h-5 text-blue-500" />
                                <h1 className="text-xl font-bold">ສແກນເພີ່ມພັດສະດຸ</h1>
                            </div>
                        </div>
                        {createdCount > 0 && (
                            <div className="flex items-center gap-1 text-green-600">
                                <Check className="w-4 h-4" />
                                <span className="font-medium">{createdCount}</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
                {/* Mode Toggle */}
                <div className="flex gap-2">
                    <Button
                        variant={mode === 'scan' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setMode('scan')}
                    >
                        <Camera className="w-4 h-4 mr-2" />
                        ສແກນ
                    </Button>
                    <Button
                        variant={mode === 'manual' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setMode('manual')}
                    >
                        <Keyboard className="w-4 h-4 mr-2" />
                        ພິມເອງ
                    </Button>
                </div>

                {/* Scanner or Manual Input */}
                <Card>
                    <CardContent className="p-4">
                        {mode === 'scan' ? (
                            <BarcodeScanner onScan={handleScan} />
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>ເລກ Tracking ໄທ</Label>
                                    <Input
                                        value={thaiTracking}
                                        onChange={(e) => setThaiTracking(e.target.value.toUpperCase())}
                                        placeholder="TH1234567890123"
                                        className="text-lg font-mono"
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Scanned Result */}
                {thaiTracking && (
                    <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Package className="w-6 h-6 text-blue-500" />
                                <div className="flex-1">
                                    <p className="text-sm text-blue-600">Tracking ໄທ</p>
                                    <p className="font-mono font-bold text-lg">{thaiTracking}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setThaiTracking('');
                            setLastScanned(null);
                        }}
                        disabled={!thaiTracking || isCreating}
                    >
                        ລ້າງ
                    </Button>
                    <Button
                        onClick={handleQuickCreate}
                        disabled={!thaiTracking || isCreating}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isCreating ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Check className="w-4 h-4 mr-2" />
                        )}
                        ສ້າງດ່ວນ
                    </Button>
                </div>

                {/* Info */}
                <p className="text-center text-sm text-gray-500">
                    ການສ້າງດ່ວນຈະໃຊ້ຄ່າ default • ແກ້ໄຂພາຍຫຼັງໄດ້
                </p>
            </main>
        </div>
    );
}
