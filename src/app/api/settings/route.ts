import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// GET /api/settings - Get settings
export async function GET(request: Request) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return NextResponse.json(
                { error: 'ບໍ່ໄດ້ເຂົ້າສູ່ລະບົບ' },
                { status: 401 }
            );
        }

        // Get or create default settings
        let settings = await prisma.settings.findUnique({
            where: { id: 'default' },
        });

        if (!settings) {
            settings = await prisma.settings.create({
                data: { id: 'default' },
            });
        }

        return NextResponse.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        console.error('Get settings error:', error);
        return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດ' },
            { status: 500 }
        );
    }
}

// PATCH /api/settings - Update settings (ADMIN only)
export async function PATCH(request: Request) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return NextResponse.json(
                { error: 'ບໍ່ໄດ້ເຂົ້າສູ່ລະບົບ' },
                { status: 401 }
            );
        }

        if (auth.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'ບໍ່ມີສິດໃນການແກ້ໄຂ' },
                { status: 403 }
            );
        }

        const body = await request.json();

        const settings = await prisma.settings.upsert({
            where: { id: 'default' },
            create: {
                id: 'default',
                ...body,
            },
            update: body,
        });

        return NextResponse.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        console.error('Update settings error:', error);
        return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດ' },
            { status: 500 }
        );
    }
}
