'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft,
    Download,
    Loader2,
    TrendingUp,
    DollarSign,
    Package,
    AlertCircle,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { exportToCSV } from '@/lib/api-client';
import { toast } from 'sonner';

interface DailyReport {
    date: string;
    count: number;
    thToLa: number;
    laToTh: number;
    revenue: number;
    codAmount: number;
}

interface CodSummary {
    pending: { count: number; amount: number };
    collected: { count: number; amount: number };
    transferred: { count: number; amount: number };
}

const COLORS = ['#f59e0b', '#22c55e', '#3b82f6'];

export default function ReportsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [dailyReport, setDailyReport] = useState<DailyReport[]>([]);
    const [totals, setTotals] = useState<any>(null);
    const [codSummary, setCodSummary] = useState<CodSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    // Check access
    useEffect(() => {
        if (!authLoading && user) {
            if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
                router.push('/dashboard');
            }
        }
    }, [user, authLoading, router]);

    // Load reports
    useEffect(() => {
        loadReports();
    }, []);

    async function loadReports() {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');

            // Load daily report
            const dailyRes = await fetch('/api/reports/daily?days=7', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const dailyData = await dailyRes.json();
            if (dailyData.success) {
                setDailyReport(dailyData.data.report);
                setTotals(dailyData.data.totals);
            }

            // Load COD report
            const codRes = await fetch('/api/reports/cod', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const codData = await codRes.json();
            if (codData.success) {
                setCodSummary(codData.data.summary);
            }
        } catch (error) {
            console.error('Load reports error:', error);
        }
        setIsLoading(false);
    }

    async function handleExport() {
        setIsExporting(true);
        const blob = await exportToCSV({});
        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shipments_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('ດາວໂຫຼດສຳເລັດ');
        } else {
            toast.error('ເກີດຂໍ້ຜິດພາດ');
        }
        setIsExporting(false);
    }

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat('lo-LA').format(amount) + ' ₭';
    }

    function formatDate(dateStr: string) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('lo-LA', { month: 'short', day: 'numeric' });
    }

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const codPieData = codSummary ? [
        { name: 'ລໍຖ້າເກັບ', value: codSummary.pending.amount },
        { name: 'ເກັບແລ້ວ', value: codSummary.collected.amount },
        { name: 'ໂອນແລ້ວ', value: codSummary.transferred.amount },
    ] : [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            </Link>
                            <h1 className="text-xl font-bold">ລາຍງານ</h1>
                        </div>
                        <Button onClick={handleExport} disabled={isExporting}>
                            {isExporting ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Download className="w-4 h-4 mr-2" />
                            )}
                            Export CSV
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">ພັດສະດຸ 7 ວັນ</p>
                                    <p className="text-xl font-bold">{totals?.totalShipments || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">ລາຍຮັບ</p>
                                    <p className="text-lg font-bold">{formatCurrency(totals?.totalRevenue || 0)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">COD ລໍຖ້າ</p>
                                    <p className="text-lg font-bold">{formatCurrency(codSummary?.pending.amount || 0)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">COD ລໍຖ້າເກັບ</p>
                                    <p className="text-xl font-bold">{codSummary?.pending.count || 0} ລາຍການ</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="daily" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="daily">ສະຖິຕິລາຍວັນ</TabsTrigger>
                        <TabsTrigger value="cod">ລາຍງານ COD</TabsTrigger>
                    </TabsList>

                    <TabsContent value="daily" className="space-y-4">
                        {/* Daily Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>ຈຳນວນພັດສະດຸ 7 ວັນຜ່ານມາ</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dailyReport}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" tickFormatter={formatDate} />
                                            <YAxis />
                                            <Tooltip
                                                formatter={(value: number | undefined) => [value ?? 0, 'ຈຳນວນ']}
                                                labelFormatter={formatDate}
                                            />
                                            <Bar dataKey="thToLa" name="TH→LA" fill="#f97316" stackId="a" />
                                            <Bar dataKey="laToTh" name="LA→TH" fill="#3b82f6" stackId="a" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Revenue Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>ລາຍຮັບ 7 ວັນຜ່ານມາ</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={dailyReport}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" tickFormatter={formatDate} />
                                            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                            <Tooltip
                                                formatter={(value: number | undefined) => [formatCurrency(value ?? 0), 'ລາຍຮັບ']}
                                                labelFormatter={formatDate}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="#22c55e"
                                                strokeWidth={2}
                                                dot={{ fill: '#22c55e' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="cod" className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* COD Pie Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>ສະຖານະ COD</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={codPieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    label={({ name, percent }) =>
                                                        `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                                                    }
                                                >
                                                    {codPieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value: number | undefined) => formatCurrency(value ?? 0)} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* COD Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>ສະຫຼຸບ COD</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                            <span>ລໍຖ້າເກັບ</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{formatCurrency(codSummary?.pending.amount || 0)}</p>
                                            <p className="text-sm text-gray-500">{codSummary?.pending.count || 0} ລາຍການ</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span>ເກັບແລ້ວ</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{formatCurrency(codSummary?.collected.amount || 0)}</p>
                                            <p className="text-sm text-gray-500">{codSummary?.collected.count || 0} ລາຍການ</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                            <span>ໂອນແລ້ວ</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{formatCurrency(codSummary?.transferred.amount || 0)}</p>
                                            <p className="text-sm text-gray-500">{codSummary?.transferred.count || 0} ລາຍການ</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
