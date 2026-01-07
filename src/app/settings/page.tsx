'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, Settings as SettingsIcon } from 'lucide-react';

interface SettingsData {
    defaultCrossBorderFee: number;
    defaultDomesticFee: number;
    trackingPrefixTH: string;
    trackingPrefixLA: string;
    companyName: string;
    companyPhone: string;
    companyAddress: string;
}

export default function SettingsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [settings, setSettings] = useState<SettingsData>({
        defaultCrossBorderFee: 50000,
        defaultDomesticFee: 20000,
        trackingPrefixTH: 'TH',
        trackingPrefixLA: 'LA',
        companyName: 'Thai-Lao Logistics',
        companyPhone: '',
        companyAddress: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Check access - ADMIN only
    useEffect(() => {
        if (!authLoading && user) {
            if (user.role !== 'ADMIN') {
                router.push('/dashboard');
            }
        }
    }, [user, authLoading, router]);

    // Load settings
    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/settings', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success && data.data) {
                setSettings(data.data);
            }
        } catch (error) {
            console.error('Load settings error:', error);
        }
        setIsLoading(false);
    }

    async function handleSave() {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/settings', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(settings),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('ບັນທຶກສຳເລັດ');
            } else {
                toast.error(data.error || 'ເກີດຂໍ້ຜິດພາດ');
            }
        } catch (error) {
            toast.error('ເກີດຂໍ້ຜິດພາດ');
        }
        setIsSaving(false);
    }

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            </Link>
                            <div className="flex items-center gap-2">
                                <SettingsIcon className="w-5 h-5 text-gray-500" />
                                <h1 className="text-xl font-bold">ຕັ້ງຄ່າ</h1>
                            </div>
                        </div>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            ບັນທຶກ
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Company Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>ຂໍ້ມູນບໍລິສັດ</CardTitle>
                        <CardDescription>ຂໍ້ມູນທີ່ຈະສະແດງໃນໃບບິນ</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>ຊື່ບໍລິສັດ</Label>
                            <Input
                                value={settings.companyName}
                                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ເບີໂທ</Label>
                            <Input
                                value={settings.companyPhone}
                                onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ທີ່ຢູ່</Label>
                            <Input
                                value={settings.companyAddress}
                                onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Default Fees */}
                <Card>
                    <CardHeader>
                        <CardTitle>ຄ່າບໍລິການ Default</CardTitle>
                        <CardDescription>ຄ່າບໍລິການທີ່ຈະໃສ່ອັດຕະໂນມັດເມື່ອສ້າງພັດສະດຸໃໝ່</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>ຄ່າຂ້າມແດນ (₭)</Label>
                            <Input
                                type="number"
                                value={settings.defaultCrossBorderFee}
                                onChange={(e) => setSettings({ ...settings, defaultCrossBorderFee: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ຄ່າຈັດສົ່ງພາຍໃນ (₭)</Label>
                            <Input
                                type="number"
                                value={settings.defaultDomesticFee}
                                onChange={(e) => setSettings({ ...settings, defaultDomesticFee: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Tracking Prefix */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tracking Number Prefix</CardTitle>
                        <CardDescription>ຕົວອັກສອນນຳໜ້າເລກ tracking</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Prefix ສົ່ງໄປໄທ (LA→TH)</Label>
                            <Input
                                value={settings.trackingPrefixTH}
                                onChange={(e) => setSettings({ ...settings, trackingPrefixTH: e.target.value.toUpperCase() })}
                                maxLength={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Prefix ສົ່ງໄປລາວ (TH→LA)</Label>
                            <Input
                                value={settings.trackingPrefixLA}
                                onChange={(e) => setSettings({ ...settings, trackingPrefixLA: e.target.value.toUpperCase() })}
                                maxLength={4}
                            />
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
