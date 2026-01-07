import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import { getShipmentById } from '@/lib/db/store';
import { prisma } from '@/lib/db/prisma';

export async function GET(
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

        const { id } = await params;
        const shipment = await getShipmentById(id);

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
        console.error('Get shipment error:', error);
        return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດ' },
            { status: 500 }
        );
    }
}

// DELETE /api/shipments/[id] - Delete shipment (MANAGER/ADMIN only)
export async function DELETE(
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

        // Check permission - MANAGER or ADMIN only
        if (auth.role !== 'MANAGER' && auth.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'ບໍ່ມີສິດໃນການລຶບພັດສະດຸ' },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Check if shipment exists
        const shipment = await prisma.shipment.findUnique({
            where: { id },
        });

        if (!shipment) {
            return NextResponse.json(
                { error: 'ບໍ່ພົບພັດສະດຸ' },
                { status: 404 }
            );
        }

        // Delete shipment (events will cascade delete)
        await prisma.shipment.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: 'ລຶບພັດສະດຸສຳເລັດ',
        });
    } catch (error) {
        console.error('Delete shipment error:', error);
        return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດ' },
            { status: 500 }
        );
    }
}
