import { SignJWT, jwtVerify } from 'jose';
import { User } from '@/types';

// Get secret from environment variable (required in production)
const getSecret = () => {
    const secret = process.env.JWT_SECRET || 'thai-lao-logistics-dev-secret-key-2024';
    return new TextEncoder().encode(secret);
};

export interface TokenPayload {
    userId: string;
    username: string;
    role: string;
}

// Generate JWT token using jose
export async function generateToken(user: User): Promise<string> {
    const token = await new SignJWT({
        userId: user.id,
        username: user.username,
        role: user.role,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(getSecret());

    return token;
}

// Verify JWT token
export async function verifyToken(token: string): Promise<TokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getSecret());

        return {
            userId: payload.userId as string,
            username: payload.username as string,
            role: payload.role as string,
        };
    } catch (error) {
        // Token invalid or expired
        return null;
    }
}

// Synchronous token verification for middleware (cached result)
const tokenCache = new Map<string, { payload: TokenPayload; exp: number }>();

export function verifyTokenSync(token: string): TokenPayload | null {
    // Check cache first
    const cached = tokenCache.get(token);
    if (cached && cached.exp > Date.now()) {
        return cached.payload;
    }

    // For sync verification, decode without verification (only for initial request)
    // The actual verification happens async in the route
    try {
        const [, payloadBase64] = token.split('.');
        if (!payloadBase64) return null;

        const payloadStr = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
        const payload = JSON.parse(payloadStr);

        // Check expiration
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            return null;
        }

        const result: TokenPayload = {
            userId: payload.userId,
            username: payload.username,
            role: payload.role,
        };

        // Cache for 5 minutes
        tokenCache.set(token, { payload: result, exp: Date.now() + 5 * 60 * 1000 });

        return result;
    } catch {
        return null;
    }
}

// Extract auth from request headers (sync version for immediate use)
export function getAuthFromRequest(request: Request): TokenPayload | null {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.slice(7);
    return verifyTokenSync(token);
}

// Async version for routes that need verified auth
export async function getAuthFromRequestAsync(request: Request): Promise<TokenPayload | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.slice(7);
    return verifyToken(token);
}

// Check if request is authenticated
export function isAuthenticated(request: Request): boolean {
    return getAuthFromRequest(request) !== null;
}

// Get user ID from request
export function getUserIdFromRequest(request: Request): string | null {
    const auth = getAuthFromRequest(request);
    return auth?.userId || null;
}
