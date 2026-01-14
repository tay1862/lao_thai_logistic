import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;
    const filePath = join(process.cwd(), 'public', 'uploads', filename);

    try {
        const file = await readFile(filePath);
        const ext = filename.split('.').pop()?.toLowerCase();

        let contentType = 'image/jpeg';
        if (ext === 'png') contentType = 'image/png';
        else if (ext === 'webp') contentType = 'image/webp';
        else if (ext === 'gif') contentType = 'image/gif';

        return new NextResponse(file, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        return new NextResponse('Image not found', { status: 404 });
    }
}
