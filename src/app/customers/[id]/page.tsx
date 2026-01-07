'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Phone, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCustomer, getShipments } from '@/lib/api-client';
import { Customer, Shipment, ShipmentStatus } from '@/types';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function CustomerHistoryPage({ params }: PageProps) {
    const router = useRouter();
    // Unwrap params using React.use()
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            try {
                const [customerRes, shipmentsRes] = await Promise.all([
                    getCustomer(id),
                    getShipments({ customerId: id, limit: 100 }) // Fetch last 100 shipments
                ]);

                if (customerRes.success && customerRes.data) {
                    setCustomer(customerRes.data);
                }

                if (shipmentsRes.success && shipmentsRes.data) {
                    setShipments(shipmentsRes.data.shipments);
                }
            } catch (error) {
                console.error('Failed to load data', error);
            }
            setIsLoading(false);
        }

        if (id) {
            loadData();
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
                <p className="text-gray-500">ບໍ່ພົບຂໍ້ມູນລູກຄ້າ</p>
                <Button onClick={() => router.back()}>ກັບຄືນ</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                {customer.name}
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-mono">
                                    {customer.code}
                                </span>
                            </h1>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                <Phone className="w-3 h-3" /> {customer.phone}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">ສົ່ງທັງໝົດ</p>
                                <p className="text-2xl font-bold">{shipments.length} <span className="text-sm font-normal text-gray-400">ຊິ້ນ</span></p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">ລົງທະບຽນເມື່ອ</p>
                                <p className="text-base font-semibold">{new Date(customer.createdAt).toLocaleDateString('lo-LA')}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-gray-500 mb-1">ທີ່ຢູ່</p>
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                                <p className="text-sm text-gray-900 line-clamp-2">
                                    {customer.defaultAddress || '-'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Shipment History */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-5 h-5 text-gray-500" />
                        ປະຫວັດການສົ່ງ
                    </h2>

                    {shipments.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                            <p className="text-gray-500">ຍັງບໍ່ມີປະຫວັດການສົ່ງ</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {shipments.map((s) => (
                                <Link href={`/tracking/${s.companyTracking}`} key={s.id} target="_blank">
                                    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                                        <CardContent className="p-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-lg text-blue-600 font-mono">
                                                            {s.companyTracking}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.currentStatus]}`}>
                                                            {STATUS_LABELS[s.currentStatus]}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-500 space-x-3">
                                                        <span>{new Date(s.createdAt).toLocaleDateString('lo-LA')}</span>
                                                        <span>•</span>
                                                        <span>{s.parcelType} ({s.weight}kg)</span>
                                                        {s.codAmount && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-orange-500 font-medium">COD: {s.codAmount.toLocaleString()}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <ExternalLink className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
