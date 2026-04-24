import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserFromRequest } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/track', '/api/v1/auth/login', '/api/v1/tracking']
const DASHBOARD_ROOT = '/dashboard'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||
    pathname === '/'
  ) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL(DASHBOARD_ROOT, req.url))
    }
    return NextResponse.next()
  }

  const user = await getSessionUserFromRequest(req)

  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith('/dashboard/admin') && user.role !== 'admin') {
    return NextResponse.redirect(new URL(DASHBOARD_ROOT, req.url))
  }

  const res = NextResponse.next()
  res.headers.set('x-user-id', user.id)
  res.headers.set('x-user-role', user.role)
  if (user.branchId) res.headers.set('x-user-branch-id', user.branchId)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
