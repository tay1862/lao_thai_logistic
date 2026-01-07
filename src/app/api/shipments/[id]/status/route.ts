import { NextResponse } from 'next/server';
import { getAuthFromRequest, getUserIdFromRequest } from '@/lib/auth';
import { updateShipmentStatus } from '@/lib/db/store';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return NextResponse.json(
                { error: 'ບໍ່ໄດ້ເຂົ້າສູ່ລະບົບ' },
                { status: 401 }
            );
        }

        const userId = getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json(
                { error: 'ບໍ່ໄດ້ເຂົ້າສູ່ລະບົບ' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();

        if (!body.status) {
            return NextResponse.json(
                { error: 'ກະລຸນາລະບຸສະຖານະ' },
                { status: 400 }
            );
        }

        const shipment = await updateShipmentStatus(id, body, userId);

        if (!shipment) {
            return NextResponse.json(
                { error: 'ບໍ່ພົບພັດສະດຸ' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: shipment,
        });
    } catch (error) {
        console.error('Update status error:', error);
        return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດ' },
            { status: 500 }
        );
    }
}
