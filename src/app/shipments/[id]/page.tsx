'use client';

import { useState, useEffect, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    User,
    Phone,
    MapPin,
    Clock,
    DollarSign,
    Printer,
    CheckCircle,
    Truck,
    XCircle,
    Home,
    Package,
    X,
    Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DirectionBadge } from '@/components/shipments/direction-badge';
import { StatusBadge } from '@/components/shipments/status-badge';
import { CodBadge } from '@/components/shipments/cod-badge';
import { ShippingLabel } from '@/components/print/shipping-label';
import { Shipment, ShipmentStatus, ShipmentDirection, CodStatus, LastMileMethod } from '@/types';
import { formatLAK, formatDateTime, STATUS_LABELS } from '@/lib/constants';
import { getShipment, updateShipmentStatus, updateCodStatus, getAuthToken } from '@/lib/api-client';
import { toast } from 'sonner';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ShipmentDetailPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLastMile, setSelectedLastMile] = useState<LastMileMethod | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showPrintDialog, setShowPrintDialog] = useState(false);
    const printLabelRef = useRef<HTMLDivElement>(null);

    const fetchShipment = useCallback(async () => {
        setIsLoading(true);
        const result = await getShipment(resolvedParams.id);
        if (result.success && result.data) {
            setShipment(result.data);
        } else {
            toast.error('ບໍ່ພົບພັດສະດຸ');
        }
        setIsLoading(false);
    }, [resolvedParams.id]);

    useEffect(() => {
        // Check auth
        const token = getAuthToken();
        if (!token) {
            router.push('/login');
            return;
        }

        fetchShipment();
    }, [router, fetchShipment]);

    const handleStatusUpdate = async (status: ShipmentStatus) => {
        if (!shipment) return;
        setActionLoading(status);

        const result = await updateShipmentStatus(shipment.id, {
            status,
            location: 'ວຽງຈັນ',
        });

        if (result.success && result.data) {
            setShipment(result.data);
            toast.success('ອັບເດດສະຖານະສຳເລັດ');
        } else {
            toast.error(result.error || 'ເກີດຂໍ້ຜິດພາດ');
        }

        setActionLoading(null);
    };

    const handleLastMileConfirm = async () => {
        if (!shipment || !selectedLastMile) return;
        setActionLoading('lastmile');

        // Use status update to mark as ready for pickup or out for delivery
        const newStatus = selectedLastMile === LastMileMethod.PICKUP
            ? ShipmentStatus.READY_FOR_PICKUP
            : ShipmentStatus.OUT_FOR_DELIVERY;

        const result = await updateShipmentStatus(shipment.id, {
            status: newStatus,
            location: 'ວຽງຈັນ',
            notes: selectedLastMile === LastMileMethod.PICKUP ? 'ລູກຄ້າມາເອົາເອງ' : 'ນຳສົ່ງຮອດບ້ານ',
        });

        if (result.success && result.data) {
            setShipment({
                ...result.data,
                lastMileMethod: selectedLastMile,
            });
            toast.success('ບັນທຶກວິທີສົ່ງສຳເລັດ');
        } else {
            toast.error(result.error || 'ເກີດຂໍ້ຜິດພາດ');
        }

        setActionLoading(null);
    };

    const handleCodCollected = async () => {
        if (!shipment) return;
        setActionLoading('cod');

        const result = await updateCodStatus(shipment.id, {
            status: CodStatus.COLLECTED,
        });

        if (result.success && result.data) {
            setShipment(result.data);
            toast.success('ບັນທຶກເກັບເງິນສຳເລັດ');
        } else {
            toast.error(result.error || 'ເກີດຂໍ້ຜິດພາດ');
        }

        setActionLoading(null);
    };

    const handlePrint = () => {
        setShowPrintDialog(true);
    };

    const executePrint = () => {
        if (!printLabelRef.current) return;

        const printContents = printLabelRef.current.innerHTML;
        const printWindow = window.open('', '_blank', 'width=400,height=600');

        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Print Label - ${shipment?.companyTracking}</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                        @media print {
                            @page { size: 10cm 15cm; margin: 0; }
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        }
                        .border-orange-400 { border-color: #fb923c; }
                        .border-blue-400 { border-color: #60a5fa; }
                        .bg-gray-50 { background-color: #f9fafb; }
                        .bg-gray-100 { background-color: #f3f4f6; }
                        .bg-yellow-100 { background-color: #fef9c3; }
                        .text-gray-400 { color: #9ca3af; }
                        .text-gray-500 { color: #6b7280; }
                        .text-gray-600 { color: #4b5563; }
                        .text-red-600 { color: #dc2626; }
                        .font-bold { font-weight: 700; }
                        .font-extrabold { font-weight: 800; }
                        .font-medium { font-weight: 500; }
                        .font-mono { font-family: monospace; }
                        .text-xs { font-size: 0.75rem; }
                        .text-sm { font-size: 0.875rem; }
                        .text-base { font-size: 1rem; }
                        .text-lg { font-size: 1.125rem; }
                        .text-center { text-align: center; }
                        .border-2 { border-width: 2px; }
                        .border-b-2 { border-bottom-width: 2px; }
                        .border-y-2 { border-top-width: 2px; border-bottom-width: 2px; }
                        .border-b { border-bottom-width: 1px; }
                        .border-t { border-top-width: 1px; }
                        .border-gray-800 { border-color: #1f2937; }
                        .border-gray-300 { border-color: #d1d5db; }
                        .border-gray-400 { border-color: #9ca3af; }
                        .border-gray-200 { border-color: #e5e7eb; }
                        .border-dashed { border-style: dashed; }
                        .rounded { border-radius: 0.25rem; }
                        .p-6 { padding: 1.5rem; }
                        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
                        .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
                        .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
                        .pb-3 { padding-bottom: 0.75rem; }
                        .pt-3 { padding-top: 0.75rem; }
                        .mb-2 { margin-bottom: 0.5rem; }
                        .mb-3 { margin-bottom: 0.75rem; }
                        .mt-1 { margin-top: 0.25rem; }
                        .ml-1 { margin-left: 0.25rem; }
                        .-mx-2 { margin-left: -0.5rem; margin-right: -0.5rem; }
                        .space-y-1 > * + * { margin-top: 0.25rem; }
                        .space-y-2 > * + * { margin-top: 0.5rem; }
                        .flex { display: flex; }
                        .grid { display: grid; }
                        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                        .gap-2 { gap: 0.5rem; }
                        .justify-between { justify-content: space-between; }
                        .mx-auto { margin-left: auto; margin-right: auto; }
                        .tracking-wide { letter-spacing: 0.025em; }
                        .w-full { width: 100%; }
                    </style>
                </head>
                <body>
                    ${printContents}
                </body>
                </html>
            `);
            printWindow.document.close();

            // Wait for content to load then print
            setTimeout(() => {
                printWindow.print();
            }, 250);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-60 w-full" />
            </div>
        );
    }

    if (!shipment) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
                <Package className="w-16 h-16 text-gray-300" />
                <p className="text-gray-500">ບໍ່ພົບຂໍ້ມູນພັດສະດຸ</p>
                <Button onClick={() => router.back()}>ກັບຄືນ</Button>
            </div>
        );
    }

    const totalCharge = shipment.crossBorderFee + (shipment.codAmount || 0);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="rounded-full"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex-1">
                            <h1 className="font-bold text-gray-900">{shipment.companyTracking}</h1>
                            {shipment.thaiTracking && (
                                <p className="text-sm text-gray-500">TH: {shipment.thaiTracking}</p>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={handlePrint}>
                            <Printer className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 space-y-6">
                {/* Status Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap gap-2"
                >
                    <DirectionBadge direction={shipment.direction} size="lg" />
                    <StatusBadge status={shipment.currentStatus} size="lg" />
                    {shipment.codAmount && shipment.codAmount > 0 && (
                        <CodBadge status={shipment.codStatus} amount={shipment.codAmount} size="lg" />
                    )}
                </motion.div>

                {/* Receiver/Sender Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="border-0 shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-500" />
                                {shipment.direction === ShipmentDirection.TH_TO_LA ? 'ຜູ້ຮັບ (ລາວ)' : 'ผู้รับ (ไทย)'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">{shipment.receiverName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <a href={`tel:${shipment.receiverPhone}`} className="text-blue-600">
                                    {shipment.receiverPhone}
                                </a>
                            </div>
                            {shipment.receiverAddress && (
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <span className="text-gray-600">{shipment.receiverAddress}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Photos Section */}
                {shipment.photos && shipment.photos.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <Card className="border-0 shadow-md">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Camera className="w-5 h-5 text-pink-500" />
                                    ຮູບພາບພັດສະດຸ
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4 overflow-x-auto pb-2">
                                    {shipment.photos.map((photo) => (
                                        <div key={photo.id} className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                            <a href={photo.url} target="_blank" rel="noopener noreferrer">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={photo.url}
                                                    alt="Shipment Photo"
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

                {/* Last-Mile Decision (for TH→LA only) */}
                {shipment.direction === ShipmentDirection.TH_TO_LA &&
                    shipment.currentStatus === ShipmentStatus.ARRIVED_AT_HUB && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                        >
                            <Card className="border-2 border-blue-200 shadow-md bg-blue-50/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Truck className="w-5 h-5 text-blue-500" />
                                        ວິທີການສົ່ງ Last-mile
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setSelectedLastMile(LastMileMethod.PICKUP)}
                                            className={`p-4 rounded-xl border-2 text-center transition-all ${selectedLastMile === LastMileMethod.PICKUP
                                                ? 'border-blue-500 bg-blue-100'
                                                : 'border-gray-200 bg-white hover:border-blue-300'
                                                }`}
                                        >
                                            <Home className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                                            <p className="font-medium text-sm">ລູກຄ້າມາເອົາເອງ</p>
                                        </button>
                                        <button
                                            onClick={() => setSelectedLastMile(LastMileMethod.DELIVERY)}
                                            className={`p-4 rounded-xl border-2 text-center transition-all ${selectedLastMile === LastMileMethod.DELIVERY
                                                ? 'border-blue-500 bg-blue-100'
                                                : 'border-gray-200 bg-white hover:border-blue-300'
                                                }`}
                                        >
                                            <Truck className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                                            <p className="font-medium text-sm">ນຳສົ່ງຮອດບ້ານ</p>
                                        </button>
                                    </div>
                                    {selectedLastMile && (
                                        <Button
                                            onClick={handleLastMileConfirm}
                                            disabled={actionLoading === 'lastmile'}
                                            className="w-full gradient-primary"
                                        >
                                            {actionLoading === 'lastmile' ? 'ກຳລັງບັນທຶກ...' : 'ຢືນຢັນ'}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="border-0 shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">ອັບເດດສະຖານະ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleStatusUpdate(ShipmentStatus.ARRIVED_AT_HUB)}
                                    disabled={shipment.currentStatus === ShipmentStatus.ARRIVED_AT_HUB || actionLoading !== null}
                                    className="h-auto py-4 flex flex-col items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl"
                                >
                                    <MapPin className="w-6 h-6" />
                                    <span className="text-sm">ຖືງສະຖານີ</span>
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() => handleStatusUpdate(ShipmentStatus.OUT_FOR_DELIVERY)}
                                    disabled={shipment.currentStatus === ShipmentStatus.OUT_FOR_DELIVERY || actionLoading !== null}
                                    className="h-auto py-4 flex flex-col items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                                >
                                    <Truck className="w-6 h-6" />
                                    <span className="text-sm">ກຳລັງສົ່ງ</span>
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() => handleStatusUpdate(ShipmentStatus.DELIVERED)}
                                    disabled={shipment.currentStatus === ShipmentStatus.DELIVERED || actionLoading !== null}
                                    className="h-auto py-4 flex flex-col items-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-xl"
                                >
                                    <CheckCircle className="w-6 h-6" />
                                    <span className="text-sm">ສົ່ງສຳເລັດ</span>
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() => handleStatusUpdate(ShipmentStatus.FAILED)}
                                    disabled={shipment.currentStatus === ShipmentStatus.FAILED || actionLoading !== null}
                                    className="h-auto py-4 flex flex-col items-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-xl"
                                >
                                    <XCircle className="w-6 h-6" />
                                    <span className="text-sm">ລົ້ມເຫລວ</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* COD Collection */}
                {shipment.codAmount && shipment.codAmount > 0 && shipment.currentStatus === ShipmentStatus.DELIVERED && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                    >
                        <Card className="border-2 border-yellow-200 shadow-md bg-yellow-50/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-yellow-600" />
                                    COD Collection
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center mb-4">
                                    <p className="text-sm text-gray-600">ຈຳນວນເງິນເກັບ</p>
                                    <p className="text-3xl font-bold text-yellow-700">{formatLAK(shipment.codAmount)}</p>
                                </div>
                                {shipment.codStatus === CodStatus.PENDING ? (
                                    <Button
                                        onClick={handleCodCollected}
                                        disabled={actionLoading === 'cod'}
                                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                                    >
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        {actionLoading === 'cod' ? 'ກຳລັງບັນທຶກ...' : 'ເກັບເງິນແລ້ວ'}
                                    </Button>
                                ) : (
                                    <div className="text-center py-2 px-4 bg-green-100 text-green-700 rounded-lg font-medium">
                                        ✓ ເກັບເງິນແລ້ວ
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="border-0 shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-500" />
                                ປະຫວັດການຂົນສົ່ງ
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-0">
                                {shipment.events?.map((event, index) => {
                                    const isFirst = index === 0;
                                    const isLast = index === (shipment.events?.length ?? 0) - 1;

                                    return (
                                        <div key={event.id} className="relative flex gap-4 py-3">
                                            {!isLast && (
                                                <div className="absolute left-[11px] top-9 bottom-0 w-0.5 bg-blue-100" />
                                            )}
                                            <div
                                                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center ${isFirst ? 'bg-blue-500' : 'bg-green-500'
                                                    }`}
                                            >
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-medium ${isFirst ? 'text-blue-600' : 'text-gray-700'}`}>
                                                    {STATUS_LABELS[event.status]}
                                                </p>
                                                {event.location && (
                                                    <p className="text-sm text-gray-500">{event.location}</p>
                                                )}
                                                {event.notes && (
                                                    <p className="text-sm text-gray-400 italic">{event.notes}</p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDateTime(event.createdAt)}
                                                    {event.createdBy && ` • ${event.createdBy.fullName}`}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Charges Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <Card className="border-0 shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-green-500" />
                                ຄ່າໃຊ້ຈ່າຍ
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-600">ຄ່າຂົນສົ່ງຂ້າມແດນ</span>
                                    <span className="font-medium">{formatLAK(shipment.crossBorderFee)}</span>
                                </div>
                                {shipment.codAmount && (
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-600">COD</span>
                                        <span className="font-medium">{formatLAK(shipment.codAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between py-3 bg-blue-50 -mx-4 px-4 rounded-lg mt-2">
                                    <span className="font-semibold text-blue-700">ລວມທັງໝົດ</span>
                                    <span className="font-bold text-xl text-blue-700">{formatLAK(totalCharge)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </main>

            {/* Print Dialog Modal */}
            {showPrintDialog && shipment && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-2xl">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Printer className="w-5 h-5 text-blue-500" />
                                ພິມ Label
                            </h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowPrintDialog(false)}
                                className="rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Label Preview */}
                        <div className="p-4 bg-gray-100 overflow-x-auto">
                            <div className="transform scale-75 origin-top">
                                <ShippingLabel ref={printLabelRef} shipment={shipment} />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-gray-200 flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowPrintDialog(false)}
                            >
                                ຍົກເລີກ
                            </Button>
                            <Button
                                className="flex-1 gradient-primary"
                                onClick={() => {
                                    executePrint();
                                    toast.success('ກຳລັງເປີດໜ້າພິມ...');
                                }}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                ພິມ Label
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

