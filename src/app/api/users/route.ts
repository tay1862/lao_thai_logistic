import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAuthFromRequest } from '@/lib/auth';
import { getUsers } from '@/lib/db/store';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@/types';

// GET /api/users - List all users (MANAGER/ADMIN only)
export async function GET(request: Request) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return NextResponse.json(
                { error: 'ບໍ່ໄດ້ເຂົ້າສູ່ລະບົບ' },
                { status: 401 }
            );
        }

        // Check role
        if (auth.role !== 'MANAGER' && auth.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'ບໍ່ມີສິດໃນການເຂົ້າເຖິງ' },
                { status: 403 }
            );
        }

        const users = await getUsers();

        return NextResponse.json({
            success: true,
            data: users,
        });
    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດ' },
            { status: 500 }
        );
    }
}

// POST /api/users - Create new user (MANAGER/ADMIN only)
export async function POST(request: Request) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return NextResponse.json(
                { error: 'ບໍ່ໄດ້ເຂົ້າສູ່ລະບົບ' },
                { status: 401 }
            );
        }

        // Check role
        if (auth.role !== 'MANAGER' && auth.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'ບໍ່ມີສິດໃນການເຂົ້າເຖິງ' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { username, password, fullName, role } = body;

        // Validate required fields
        if (!username || !password || !fullName) {
            return NextResponse.json(
                { error: 'ກະລຸນາໃສ່ຂໍ້ມູນໃຫ້ຄົບ' },
                { status: 400 }
            );
        }

        // Check if username already exists
        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'ຊື່ຜູ້ໃຊ້ນີ້ມີຢູ່ແລ້ວ' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                fullName,
                role: role || 'STAFF',
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                ...user,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
            },
        });
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດ' },
            { status: 500 }
        );
    }
}
