import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';
import { getUserByUsername } from '@/lib/db/store';
import { checkRateLimit, getClientIp, loginRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: Request) {
    try {
        // Rate limiting for login attempts
        const clientIp = getClientIp(request);
        const rateCheck = checkRateLimit(`login:${clientIp}`, loginRateLimit);

        if (!rateCheck.allowed) {
            return rateLimitResponse(rateCheck.resetIn);
        }

        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { error: 'ກະລຸນາໃສ່ຊື່ຜູ້ໃຊ້ ແລະ ລະຫັດຜ່ານ' },
                { status: 400 }
            );
        }

        const user = await getUserByUsername(username);

        if (!user) {
            return NextResponse.json(
                { error: 'ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ' },
                { status: 401 }
            );
        }

        // Check password - support both hashed and plain (for migration)
        const isPasswordValid = user.password.startsWith('$2')
            ? await bcrypt.compare(password, user.password)
            : password === user.password;

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ' },
                { status: 401 }
            );
        }

        const token = await generateToken(user);
        const { password: _password, ...userData } = user;

        return NextResponse.json({
            success: true,
            data: {
                token,
                user: userData,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດ' },
            { status: 500 }
        );
    }
}
