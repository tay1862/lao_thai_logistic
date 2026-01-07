import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import { getDashboardStats } from '@/lib/db/store';

export async function GET(request: Request) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return NextResponse.json(
                { error: 'ບໍ່ໄດ້ເຂົ້າສູ່ລະບົບ' },
                { status: 401 }
            );
        }

        const stats = await getDashboardStats();

        return NextResponse.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Get stats error:', error);
        return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດ' },
            { status: 500 }
        );
    }
}
