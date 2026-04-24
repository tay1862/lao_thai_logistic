import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format currency with locale */
export function formatCurrency(amount: number, currency: 'THB' | 'LAK'): string {
  if (currency === 'THB') {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount)
  }
  return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(amount)
}

/** Format date to Thai/Lao friendly display */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/** Get IP from request headers (works behind reverse proxy) */
export function getClientIp(req: Request): string {
  return (
    (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

/** Generate tracking number: THL-YYYYMMDD-NNNNN */
export function generateTrackingNo(sequence: number): string {
  const date = new Date()
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(sequence).padStart(5, '0')
  return `THL-${ymd}-${seq}`
}

/** Simple rate-limit store (in-process; use Redis in production for multi-instance) */
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(key)
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  entry.count++
  if (entry.count > maxAttempts) return false
  return true
}

export function clearRateLimit(key: string) {
  loginAttempts.delete(key)
}

