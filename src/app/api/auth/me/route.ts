import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import { getUserById } from '@/lib/db/store';

export async function GET(request: Request) {
    try {
        const auth = getAuthFromRequest(request);

        if (!auth) {
            return NextResponse.json(
                { error: 'ບໍ່ໄດ້ເຂົ້າສູ່ລະບົບ' },
                { status: 401 }
            );
        }

        const user = await getUserById(auth.userId);

        if (!user) {
            return NextResponse.json(
                { error: 'ບໍ່ພົບຜູ້ໃຊ້' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດ' },
            { status: 500 }
        );
    }
}
