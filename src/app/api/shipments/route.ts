import { NextResponse } from 'next/server';
import { getAuthFromRequest, getUserIdFromRequest } from '@/lib/auth';
import { createShipment, getShipments } from '@/lib/db/store';
import { ShipmentFilters } from '@/types';

// GET /api/shipments - List shipments with filters
export async function GET(request: Request) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return NextResponse.json(
                { error: 'ບໍ່ໄດ້ເຂົ້າສູ່ລະບົບ' },
                { status: 401 }
            );
        }

        const url = new URL(request.url);
        const filters: ShipmentFilters = {};

        const status = url.searchParams.get('status');
        const direction = url.searchParams.get('direction');
        const codStatus = url.searchParams.get('codStatus');
        const search = url.searchParams.get('search');
        const dateFrom = url.searchParams.get('dateFrom');
        const dateTo = url.searchParams.get('dateTo');
        const page = url.searchParams.get('page');
        const limit = url.searchParams.get('limit');
        const customerId = url.searchParams.get('customerId');

        if (status) filters.status = status as ShipmentFilters['status'];
        if (direction) filters.direction = direction as ShipmentFilters['direction'];
        if (codStatus) filters.codStatus = codStatus as ShipmentFilters['codStatus'];
        if (customerId) filters.customerId = customerId;
        if (search) filters.search = search;
        if (dateFrom) filters.dateFrom = dateFrom;
        if (dateTo) filters.dateTo = dateTo;
        if (page) filters.page = parseInt(page, 10);
        if (limit) filters.limit = parseInt(limit, 10);

        const result = await getShipments(filters);

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Get shipments error:', error);
        return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດ' },
            { status: 500 }
        );
    }
}

// POST /api/shipments - Create new shipment
export async function POST(request: Request) {
    try {
        const userId = getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json(
                { error: 'ບໍ່ໄດ້ເຂົ້າສູ່ລະບົບ' },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Validate required fields
        const requiredFields = ['direction', 'parcelType', 'weight', 'receiverName', 'receiverPhone', 'crossBorderFee'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `ກະລຸນາໃສ່ ${field}` },
                    { status: 400 }
                );
            }
        }

        const shipment = await createShipment(body, userId);

        return NextResponse.json({
            success: true,
            data: shipment,
        });
    } catch (error) {
        console.error('Create shipment error:', error);
        return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດ' },
            { status: 500 }
        );
    }
}
