import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// GET /api/reports/cod - Get COD report
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

        // Get COD summary by status
        const codStats = await prisma.shipment.groupBy({
            by: ['codStatus'],
            where: {
                codAmount: { gt: 0 },
            },
            _count: true,
            _sum: { codAmount: true },
        });

        // Get pending COD details
        const pendingCod = await prisma.shipment.findMany({
            where: {
                codStatus: 'PENDING',
                codAmount: { gt: 0 },
            },
            select: {
                id: true,
                companyTracking: true,
                receiverName: true,
                receiverPhone: true,
                codAmount: true,
                createdAt: true,
                currentStatus: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        // Format response
        const summary = {
            pending: { count: 0, amount: 0 },
            collected: { count: 0, amount: 0 },
            transferred: { count: 0, amount: 0 },
        };

        codStats.forEach((stat) => {
            if (stat.codStatus === 'PENDING') {
                summary.pending = { count: stat._count, amount: stat._sum.codAmount || 0 };
            } else if (stat.codStatus === 'COLLECTED') {
                summary.collected = { count: stat._count, amount: stat._sum.codAmount || 0 };
            } else if (stat.codStatus === 'TRANSFERRED') {
                summary.transferred = { count: stat._count, amount: stat._sum.codAmount || 0 };
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                summary,
                pendingList: pendingCod.map(p => ({
                    ...p,
                    createdAt: p.createdAt.toISOString(),
                })),
            },
        });
    } catch (error) {
        console.error('COD report error:', error);
        return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດ' },
            { status: 500 }
        );
    }
}
