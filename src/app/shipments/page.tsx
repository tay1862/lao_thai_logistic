'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Package, ChevronRight, DollarSign, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DirectionBadge } from '@/components/shipments/direction-badge';
import { StatusBadge } from '@/components/shipments/status-badge';
import { Shipment, ShipmentFilters } from '@/types';
import { formatLAK, formatDateTime, STATUS_LABELS } from '@/lib/constants';
import { getShipments, getAuthToken } from '@/lib/api-client';

export default function ShipmentsListPage() {
    const router = useRouter();
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [directionFilter, setDirectionFilter] = useState<string>('all');

    const fetchShipments = useCallback(async () => {
        setIsLoading(true);

        const filters: ShipmentFilters = {};
        if (searchQuery) filters.search = searchQuery;
        if (statusFilter !== 'all') filters.status = statusFilter as ShipmentFilters['status'];
        if (directionFilter !== 'all') filters.direction = directionFilter as ShipmentFilters['direction'];

        const result = await getShipments(filters);

        if (result.success && result.data) {
            setShipments(result.data.shipments);
            setTotal(result.data.total);
        }

        setIsLoading(false);
    }, [searchQuery, statusFilter, directionFilter]);

    useEffect(() => {
        // Check auth
        const token = getAuthToken();
        if (!token) {
            router.push('/login');
            return;
        }

        fetchShipments();
    }, [router, fetchShipments]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== '') {
                fetchShipments();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchShipments]);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push('/dashboard')}
                            className="rounded-full"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex-1">
                            <h1 className="font-bold text-gray-900">ລາຍການພັດສະດຸ</h1>
                            <p className="text-sm text-gray-500">{total} ລາຍການ</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={fetchShipments}
                            className="rounded-full"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-4 space-y-4">
                {/* Search & Filters */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                >
                    {/* Search */}
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="ຄົ້ນຫາ tracking, ຊື່ຜູ້ຮັບ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-12 bg-white"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2">
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); fetchShipments(); }}>
                            <SelectTrigger className="flex-1 bg-white">
                                <SelectValue placeholder="ສະຖານະ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ທັງໝົດ</SelectItem>
                                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={directionFilter} onValueChange={(v) => { setDirectionFilter(v); fetchShipments(); }}>
                            <SelectTrigger className="flex-1 bg-white">
                                <SelectValue placeholder="ທິດທາງ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ທັງໝົດ</SelectItem>
                                <SelectItem value="TH_TO_LA">TH → LA</SelectItem>
                                <SelectItem value="LA_TO_TH">LA → TH</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </motion.div>

                {/* Shipment List */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-32 w-full rounded-xl" />
                        ))}
                    </div>
                ) : shipments.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-600">ບໍ່ພົບພັດສະດຸ</h3>
                        <p className="text-gray-400">ລອງປ່ຽນຕົວກອງ ຫຼື ຄຳຄົ້ນຫາ</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {shipments.map((shipment, index) => (
                            <motion.div
                                key={shipment.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link href={`/shipments/${shipment.id}`}>
                                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{shipment.companyTracking}</h3>
                                                    {shipment.thaiTracking && (
                                                        <p className="text-sm text-gray-500">TH: {shipment.thaiTracking}</p>
                                                    )}
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-400" />
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-3">
                                                <DirectionBadge direction={shipment.direction} size="sm" />
                                                <StatusBadge status={shipment.currentStatus} size="sm" />
                                            </div>

                                            <div className="flex items-center justify-between text-sm">
                                                <div className="text-gray-600">
                                                    <span className="font-medium">{shipment.receiverName}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {shipment.codAmount && shipment.codAmount > 0 && (
                                                        <span className="text-yellow-600 font-medium flex items-center gap-1">
                                                            <DollarSign className="w-4 h-4" />
                                                            {formatLAK(shipment.codAmount)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-xs text-gray-400 mt-2">
                                                {formatDateTime(shipment.createdAt)}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
