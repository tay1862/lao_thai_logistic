// Simple in-memory rate limiter
// For production, use Redis-based solution

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Max requests per window
}

const defaultConfig: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
};

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}, 60 * 1000); // Clean every minute

export function checkRateLimit(
    identifier: string,
    config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetIn: number } {
    const { windowMs, maxRequests } = { ...defaultConfig, ...config };
    const now = Date.now();

    let entry = rateLimitStore.get(identifier);

    // Reset if window has passed
    if (!entry || entry.resetTime < now) {
        entry = {
            count: 0,
            resetTime: now + windowMs,
        };
    }

    entry.count++;
    rateLimitStore.set(identifier, entry);

    const allowed = entry.count <= maxRequests;
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetIn = Math.max(0, entry.resetTime - now);

    return { allowed, remaining, resetIn };
}

// Get client IP from request
export function getClientIp(request: Request): string {
    // Check various headers for real IP (behind proxy)
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback
    return 'unknown';
}

// Rate limit response helper
export function rateLimitResponse(resetIn: number) {
    return new Response(
        JSON.stringify({
            error: 'ກະລຸນາລໍຖ້າ ແລະ ລອງໃໝ່ອີກຄັ້ງ',
            retryAfter: Math.ceil(resetIn / 1000),
        }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(Math.ceil(resetIn / 1000)),
            },
        }
    );
}

// Login-specific rate limiter (stricter)
export const loginRateLimit = {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 5, // 5 attempts per 5 minutes
};

// API rate limiter (general)
export const apiRateLimit = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
};
