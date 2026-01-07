import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

interface BatchUpdateRequest {
    shipmentIds: string[];
    status: string;
    location?: string;
    notes?: string;
}

// POST /api/shipments/batch - Batch update shipment status
export async function POST(request: Request) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return NextResponse.json(
                { error: 'ບໍ່ໄດ້ເຂົ້າສູ່ລະບົບ' },
                { status: 401 }
            );
        }

        const body: BatchUpdateRequest = await request.json();
        const { shipmentIds, status, location, notes } = body;

        if (!shipmentIds || shipmentIds.length === 0) {
            return NextResponse.json(
                { error: 'ກະລຸນາເລືອກພັດສະດຸ' },
                { status: 400 }
            );
        }

        if (!status) {
            return NextResponse.json(
                { error: 'ກະລຸນາເລືອກສະຖານະ' },
                { status: 400 }
            );
        }

        // Update all shipments and create events
        const results = await Promise.all(
            shipmentIds.map(async (id) => {
                try {
                    // Update shipment status
                    const shipment = await prisma.shipment.update({
                        where: { id },
                        data: { currentStatus: status as any },
                    });

                    // Create event
                    await prisma.shipmentEvent.create({
                        data: {
                            shipmentId: id,
                            status: status as any,
                            location,
                            notes: notes || `Batch update`,
                            createdById: auth.userId,
                        },
                    });

                    return { id, success: true, tracking: shipment.companyTracking };
                } catch (error) {
                    return { id, success: false, error: 'ບໍ່ພົບພັດສະດຸ' };
                }
            })
        );

        const successCount = results.filter((r) => r.success).length;
        const failedCount = results.filter((r) => !r.success).length;

        return NextResponse.json({
            success: true,
            data: {
                updated: successCount,
                failed: failedCount,
                results,
            },
            message: `ອັບເດດສຳເລັດ ${successCount} ລາຍການ`,
        });
    } catch (error) {
        console.error('Batch update error:', error);
        return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດ' },
            { status: 500 }
        );
    }
}
