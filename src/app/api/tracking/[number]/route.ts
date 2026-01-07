import { NextResponse } from 'next/server';
import { getTrackingInfo } from '@/lib/db/store';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ number: string }> }
) {
    try {
        const { number } = await params;

        if (!number) {
            return NextResponse.json(
                { error: 'ກະລຸນາໃສ່ເລກພັດສະດຸ' },
                { status: 400 }
            );
        }

        const tracking = await getTrackingInfo(number);

        if (!tracking) {
            return NextResponse.json(
                { error: 'ບໍ່ພົບພັດສະດຸ' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: tracking,
        });
    } catch (error) {
        console.error('Tracking error:', error);
        return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດ' },
            { status: 500 }
        );
    }
}
