'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Package,
    TrendingUp,
    Clock,
    DollarSign,
    Plus,
    List,
    LogOut,
    Truck,
    User,
    Users,
    BarChart3,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/stat-card';
import { logout, getDashboardStats, getAuthToken } from '@/lib/api-client';
import { User as UserType, UserRole, DashboardStats } from '@/types';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserType | null>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        const result = await getDashboardStats();
        if (result.success && result.data) {
            setStats(result.data);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        // Check auth
        const userData = localStorage.getItem('user');
        const token = getAuthToken();

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        try {
            setUser(JSON.parse(userData));
            fetchStats();
        } catch {
            router.push('/login');
        }
    }, [router, fetchStats]);

    const handleLogout = () => {
        logout();
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (!user) {
        return null;
    }

    const isManager = user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                                <Package className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-gray-900">Dashboard</h1>
                                <p className="text-sm text-gray-500">{user.fullName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={fetchStats}
                                className="text-gray-500"
                            >
                                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="text-gray-500 hover:text-red-500"
                            >
                                <LogOut className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 space-y-6">
                {/* Welcome */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h2 className="text-2xl font-bold text-gray-900">
                        ສະບາຍດີ, {user.fullName}! 👋
                    </h2>
                    <p className="text-gray-500 mt-1">ສະຫຼຸບການເຮັດວຽກມື້ນີ້</p>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="ພັດສະດຸມື້ນີ້"
                        value={stats?.todayShipments ?? 0}
                        icon={Package}
                        variant="primary"
                    />
                    <StatCard
                        title="COD ລໍຖ້າເກັບ"
                        value={stats?.pendingCOD ?? 0}
                        icon={DollarSign}
                        variant="warning"
                    />
                    <StatCard
                        title="ຢູ່ສະຖານີລາວ"
                        value={stats?.atLaosHub ?? 0}
                        icon={Truck}
                        variant="success"
                    />
                    <StatCard
                        title="ກຳລັງຂົນສົ່ງ"
                        value={stats?.inTransit ?? 0}
                        icon={Clock}
                        variant="default"
                    />
                </div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="border-0 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg">ສ້າງພັດສະດຸໃໝ່</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* TH→LA Button */}
                            <Link href="/shipments/create/th-la">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="relative overflow-hidden rounded-xl p-6 gradient-th-la text-white cursor-pointer group"
                                >
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-2xl">🇹🇭</span>
                                            <span className="text-xl font-bold">→</span>
                                            <span className="text-2xl">🇱🇦</span>
                                        </div>
                                        <h3 className="font-bold text-lg">TH → LA</h3>
                                        <p className="text-white/80 text-sm mt-1">ຮັບຈາກໄທ ສົ່ງລາວ</p>
                                    </div>
                                    <Plus className="absolute right-4 bottom-4 w-8 h-8 text-white/30 group-hover:text-white/50 transition-colors" />
                                </motion.div>
                            </Link>

                            {/* LA→TH Button */}
                            <Link href="/shipments/create/la-th">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="relative overflow-hidden rounded-xl p-6 gradient-la-th text-white cursor-pointer group"
                                >
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-2xl">🇱🇦</span>
                                            <span className="text-xl font-bold">→</span>
                                            <span className="text-2xl">🇹🇭</span>
                                        </div>
                                        <h3 className="font-bold text-lg">LA → TH</h3>
                                        <p className="text-white/80 text-sm mt-1">ຮັບຈາກລາວ ສົ່ງໄທ</p>
                                    </div>
                                    <Plus className="absolute right-4 bottom-4 w-8 h-8 text-white/30 group-hover:text-white/50 transition-colors" />
                                </motion.div>
                            </Link>

                            {/* Scan & Quick Status Buttons */}
                            <Link href="/shipments/scan">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                            <BarChart3 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold">📦 ສແກນເພີ່ມ</h3>
                                            <p className="text-white/80 text-sm">ສ້າງພັດສະດຸດ່ວນ</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>

                            <Link href="/shipments/quick">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-r from-green-500 to-green-600 text-white cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold">⚡ Quick Status</h3>
                                            <p className="text-white/80 text-sm">ອັບເດດຫຼາຍຊິ້ນ</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Navigation Links */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 gap-4"
                >
                    <Link href="/shipments">
                        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                                    <List className="w-7 h-7 text-blue-500" />
                                </div>
                                <h3 className="font-semibold text-gray-900">ລາຍການພັດສະດຸ</h3>
                                <p className="text-sm text-gray-500 mt-1">ເບິ່ງ & ຈັດການພັດສະດຸທັງໝົດ</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/customers">
                        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                                    <Users className="w-7 h-7 text-orange-500" />
                                </div>
                                <h3 className="font-semibold text-gray-900">ຈັດການລູກຄ້າ</h3>
                                <p className="text-sm text-gray-500 mt-1">ຂໍ້ມູນສະມາຊິກ & ທີ່ຢູ່</p>
                            </CardContent>
                        </Card>
                    </Link>

                    {isManager && (
                        <Link href="/reports">
                            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer h-full">
                                <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                                    <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                                        <BarChart3 className="w-7 h-7 text-purple-500" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">ລາຍງານ</h3>
                                    <p className="text-sm text-gray-500 mt-1">ສະຖິຕິ & ການເງິນ</p>
                                </CardContent>
                            </Card>
                        </Link>
                    )}

                    {isManager && (
                        <Link href="/users">
                            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer h-full">
                                <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
                                        <User className="w-7 h-7 text-green-500" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">ຈັດການພະນັກງານ</h3>
                                    <p className="text-sm text-gray-500 mt-1">ເພີ່ມ/ແກ້ໄຂ/ລຶບ</p>
                                </CardContent>
                            </Card>
                        </Link>
                    )}

                    {user.role === UserRole.ADMIN && (
                        <Link href="/settings">
                            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer h-full">
                                <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                        <BarChart3 className="w-7 h-7 text-gray-500" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">ຕັ້ງຄ່າ</h3>
                                    <p className="text-sm text-gray-500 mt-1">ຄ່າບໍລິການ/ບໍລິສັດ</p>
                                </CardContent>
                            </Card>
                        </Link>
                    )}

                    {!isManager && (
                        <Card className="border-0 shadow-md h-full">
                            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
                                    <TrendingUp className="w-7 h-7 text-green-500" />
                                </div>
                                <h3 className="font-semibold text-gray-900">ສົ່ງສຳເລັດມື້ນີ້</h3>
                                <p className="text-3xl font-bold text-green-600 mt-1">{stats?.delivered ?? 0}</p>
                            </CardContent>
                        </Card>
                    )}
                </motion.div>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 safe-area-bottom z-50">
                <div className="flex justify-around items-center max-w-md mx-auto">
                    <Link href="/dashboard" className="flex flex-col items-center p-2 text-blue-600 min-w-[60px]">
                        <Package className="w-6 h-6" />
                        <span className="text-[10px] mt-1">Dashboard</span>
                    </Link>
                    <Link href="/shipments" className="flex flex-col items-center p-2 text-gray-400 hover:text-gray-600 min-w-[60px]">
                        <List className="w-6 h-6" />
                        <span className="text-[10px] mt-1">ລາຍການ</span>
                    </Link>
                    <Link href="/shipments/create/th-la" className="flex flex-col items-center p-2 min-w-[60px]">
                        <div className="w-12 h-12 -mt-6 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                            <Plus className="w-6 h-6 text-white" />
                        </div>
                    </Link>
                    <Link href="/shipments/quick" className="flex flex-col items-center p-2 text-gray-400 hover:text-gray-600 min-w-[60px]">
                        <TrendingUp className="w-6 h-6" />
                        <span className="text-[10px] mt-1">Quick</span>
                    </Link>
                    <Link href="/account" className="flex flex-col items-center p-2 text-gray-400 hover:text-gray-600 min-w-[60px]">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                            {user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <span className="text-[10px] mt-1 truncate max-w-[50px]">{user?.fullName?.split(' ')[0] || 'ບັນຊີ'}</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
}
