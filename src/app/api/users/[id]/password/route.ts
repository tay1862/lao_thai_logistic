import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAuthFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// PATCH /api/users/[id]/password - Change password
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

        const { id } = await params;

        // Users can change their own password, or ADMIN can change anyone's
        if (id !== auth.userId && auth.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'ບໍ່ມີສິດໃນການປ່ຽນລະຫັດຜ່ານ' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!newPassword) {
            return NextResponse.json(
                { error: 'ກະລຸນາໃສ່ລະຫັດຜ່ານໃໝ່' },
                { status: 400 }
            );
        }

        // If user is changing their own password, verify current password
        if (id === auth.userId) {
            const user = await prisma.user.findUnique({
                where: { id },
            });

            if (!user) {
                return NextResponse.json(
                    { error: 'ບໍ່ພົບຜູ້ໃຊ້' },
                    { status: 404 }
                );
            }

            // Support both hashed and plain passwords
            const isPasswordValid = user.password.startsWith('$2')
                ? await bcrypt.compare(currentPassword, user.password)
                : currentPassword === user.password;

            if (!isPasswordValid) {
                return NextResponse.json(
                    { error: 'ລະຫັດຜ່ານປັດຈຸບັນບໍ່ຖືກຕ້ອງ' },
                    { status: 400 }
                );
            }
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });

        return NextResponse.json({
            success: true,
            message: 'ປ່ຽນລະຫັດຜ່ານສຳເລັດ',
        });
    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດ' },
            { status: 500 }
        );
    }
}
