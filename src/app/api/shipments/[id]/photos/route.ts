import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getAuthFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// POST /api/shipments/[id]/photos - Upload photo
export async function POST(
    request: NextRequest,
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

        const formData = await request.formData();
        const file = formData.get('photo') as File;
        const type = (formData.get('type') as string) || 'OTHER';
        const notes = formData.get('notes') as string;

        if (!file) {
            return NextResponse.json(
                { error: 'ກະລຸນາເລືອກຮູບພາບ' },
                { status: 400 }
            );
        }

        // Create uploads directory
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'photos');
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${id}_${Date.now()}.${ext}`;
        const filepath = join(uploadDir, filename);

        // Write file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Save to database
        const photo = await prisma.shipmentPhoto.create({
            data: {
                shipmentId: id,
                type: type as any,
                url: `/uploads/photos/${filename}`,
                notes,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                ...photo,
                createdAt: photo.createdAt.toISOString(),
            },
        });
    } catch (error) {
        console.error('Photo upload error:', error);
        return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດ' },
            { status: 500 }
        );
    }
}

// GET /api/shipments/[id]/photos - Get all photos
export async function GET(
    request: NextRequest,
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

        const photos = await prisma.shipmentPhoto.findMany({
            where: { shipmentId: id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            success: true,
            data: photos.map((p) => ({
                ...p,
                createdAt: p.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error('Get photos error:', error);
        return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດ' },
            { status: 500 }
        );
    }
}
