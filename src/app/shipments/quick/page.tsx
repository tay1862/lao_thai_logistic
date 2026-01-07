'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Check,
    Loader2,
    Package,
    QrCode,
    Truck,
    Building,
    MapPin,
    CheckCircle,
    X,
} from 'lucide-react';
import { getShipmentByTracking, updateShipmentStatus } from '@/lib/api-client';
import { ShipmentStatus } from '@/types';
import { STATUS_LABELS } from '@/lib/constants';

// Dynamic import for barcode scanner
const BarcodeScanner = dynamic(
    () => import('@/components/scanner/barcode-scanner').then((mod) => mod.BarcodeScanner),
    { ssr: false, loading: () => <div className="h-[250px] bg-gray-100 rounded-xl animate-pulse" /> }
);

// Quick status options based on direction
const thToLaStatuses = [
    { status: ShipmentStatus.RECEIVED_AT_ORIGIN, label: 'ຮັບແລ້ວ (ໄທ)', icon: Package, color: 'bg-blue-500' },
    { status: ShipmentStatus.IN_TRANSIT, label: 'ກຳລັງສົ່ງ', icon: Truck, color: 'bg-yellow-500' },
    { status: ShipmentStatus.ARRIVED_AT_HUB, label: 'ຮອດສາຂາລາວ', icon: Building, color: 'bg-purple-500' },
    { status: ShipmentStatus.OUT_FOR_DELIVERY, label: 'ກຳລັງຈັດສົ່ງ', icon: MapPin, color: 'bg-orange-500' },
    { status: ShipmentStatus.DELIVERED, label: 'ສົ່ງສຳເລັດ', icon: CheckCircle, color: 'bg-green-500' },
];

const laToThStatuses = [
    { status: ShipmentStatus.RECEIVED_AT_ORIGIN, label: 'ຮັບແລ້ວ (ລາວ)', icon: Package, color: 'bg-blue-500' },
    { status: ShipmentStatus.IN_TRANSIT, label: 'ກຳລັງສົ່ງ', icon: Truck, color: 'bg-yellow-500' },
    { status: ShipmentStatus.ARRIVED_AT_HUB, label: 'ຮອດສາຂາໄທ', icon: Building, color: 'bg-purple-500' },
    { status: ShipmentStatus.DELIVERED, label: 'ສົ່ງສຳເລັດ', icon: CheckCircle, color: 'bg-green-500' },
];

interface ScannedShipment {
    id: string;
    tracking: string;
    receiver: string;
    currentStatus: ShipmentStatus;
    direction: string;
}

export default function QuickStatusPage() {
    const router = useRouter();
    const [scannedShipments, setScannedShipments] = useState<ScannedShipment[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<ShipmentStatus | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [lastScanned, setLastScanned] = useState<string | null>(null);

    const handleScan = useCallback(async (code: string) => {
        if (code === lastScanned) return;
        setLastScanned(code);

        // Play beep
        try {
            const audio = new Audio('/beep.mp3');
            audio.play();
        } catch { }

        // Look up shipment
        const result = await getShipmentByTracking(code);
        if (result.success && result.data) {
            const shipment = result.data;

            // Check if already scanned
            if (scannedShipments.find((s) => s.id === shipment.id)) {
                toast.info('ພັດສະດຸນີ້ສແກນແລ້ວ');
                return;
            }

            setScannedShipments((prev) => [
                ...prev,
                {
                    id: shipment.id,
                    tracking: shipment.companyTracking,
                    receiver: shipment.receiverName,
                    currentStatus: shipment.currentStatus,
                    direction: shipment.direction,
                },
            ]);
            toast.success(`ເພີ່ມ: ${shipment.companyTracking}`);
        } else {
            toast.error('ບໍ່ພົບພັດສະດຸ');
        }
    }, [lastScanned, scannedShipments]);

    const removeShipment = (id: string) => {
        setScannedShipments((prev) => prev.filter((s) => s.id !== id));
    };

    const handleBatchUpdate = async () => {
        if (!selectedStatus || scannedShipments.length === 0) {
            toast.error('ກະລຸນາເລືອກສະຖານະ');
            return;
        }

        setIsUpdating(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/shipments/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    shipmentIds: scannedShipments.map((s) => s.id),
                    status: selectedStatus,
                    notes: 'Quick status update',
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success(data.message || 'ອັບເດດສຳເລັດ');
                setScannedShipments([]);
                setSelectedStatus(null);
                setLastScanned(null);
            } else {
                toast.error(data.error || 'ເກີດຂໍ້ຜິດພາດ');
            }
        } catch (error) {
            toast.error('ເກີດຂໍ້ຜິດພາດ');
        }
        setIsUpdating(false);
    };

    // Determine which status options to show
    const statusOptions = scannedShipments.length > 0 && scannedShipments[0].direction === 'LA_TO_TH'
        ? laToThStatuses
        : thToLaStatuses;

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
                                <QrCode className="w-5 h-5 text-green-500" />
                                <h1 className="text-xl font-bold">Quick Status</h1>
                            </div>
                        </div>
                        {scannedShipments.length > 0 && (
                            <span className="text-sm font-medium bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                {scannedShipments.length} ລາຍການ
                            </span>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
                {/* Scanner */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">ສແກນພັດສະດຸ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <BarcodeScanner onScan={handleScan} />
                    </CardContent>
                </Card>

                {/* Scanned List */}
                {scannedShipments.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">ລາຍການທີ່ສແກນ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {scannedShipments.map((s) => (
                                <div
                                    key={s.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div>
                                        <p className="font-mono font-bold">{s.tracking}</p>
                                        <p className="text-sm text-gray-500">{s.receiver}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeShipment(s.id)}
                                    >
                                        <X className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Status Selection */}
                {scannedShipments.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">ເລືອກສະຖານະ</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-2">
                            {statusOptions.map((opt) => (
                                <Button
                                    key={opt.status}
                                    variant={selectedStatus === opt.status ? 'default' : 'outline'}
                                    className={`h-auto py-3 ${selectedStatus === opt.status ? opt.color : ''}`}
                                    onClick={() => setSelectedStatus(opt.status)}
                                >
                                    <opt.icon className="w-4 h-4 mr-2" />
                                    {opt.label}
                                </Button>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Update Button */}
                {scannedShipments.length > 0 && selectedStatus && (
                    <Button
                        className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
                        onClick={handleBatchUpdate}
                        disabled={isUpdating}
                    >
                        {isUpdating ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                            <Check className="w-5 h-5 mr-2" />
                        )}
                        ອັບເດດ {scannedShipments.length} ລາຍການ
                    </Button>
                )}
            </main>
        </div>
    );
}
