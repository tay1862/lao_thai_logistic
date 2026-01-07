import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// GET /api/reports/daily - Get daily shipment report
export async function GET(request: Request) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return NextResponse.json(
                { error: 'ບໍ່ໄດ້ເຂົ້າສູ່ລະບົບ' },
                { status: 401 }
            );
        }

        if (auth.role !== 'MANAGER' && auth.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'ບໍ່ມີສິດໃນການເຂົ້າເຖິງ' },
                { status: 403 }
            );
        }

        const url = new URL(request.url);
        const days = parseInt(url.searchParams.get('days') || '7', 10);

        // Get shipments grouped by date
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const shipments = await prisma.shipment.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                id: true,
                createdAt: true,
                direction: true,
                crossBorderFee: true,
                domesticFee: true,
                codAmount: true,
            },
        });

        // Group by date
        const dailyData: Record<string, {
            date: string;
            count: number;
            thToLa: number;
            laToTh: number;
            revenue: number;
            codAmount: number;
        }> = {};

        // Initialize all dates
        for (let i = 0; i <= days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            dailyData[dateStr] = {
                date: dateStr,
                count: 0,
                thToLa: 0,
                laToTh: 0,
                revenue: 0,
                codAmount: 0,
            };
        }

        // Aggregate shipments
        shipments.forEach((s) => {
            const dateStr = new Date(s.createdAt).toISOString().split('T')[0];
            if (dailyData[dateStr]) {
                dailyData[dateStr].count += 1;
                dailyData[dateStr].revenue += s.crossBorderFee + (s.domesticFee || 0);
                dailyData[dateStr].codAmount += s.codAmount || 0;
                if (s.direction === 'TH_TO_LA') {
                    dailyData[dateStr].thToLa += 1;
                } else {
                    dailyData[dateStr].laToTh += 1;
                }
            }
        });

        // Convert to array and sort by date
        const report = Object.values(dailyData).sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Calculate totals
        const totals = {
            totalShipments: shipments.length,
            totalRevenue: shipments.reduce((sum, s) => sum + s.crossBorderFee + (s.domesticFee || 0), 0),
            totalCod: shipments.reduce((sum, s) => sum + (s.codAmount || 0), 0),
            thToLa: shipments.filter(s => s.direction === 'TH_TO_LA').length,
            laToTh: shipments.filter(s => s.direction === 'LA_TO_TH').length,
        };

        return NextResponse.json({
            success: true,
            data: {
                report,
                totals,
                period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
            },
        });
    } catch (error) {
        console.error('Daily report error:', error);
        return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດ' },
            { status: 500 }
        );
    }
}
