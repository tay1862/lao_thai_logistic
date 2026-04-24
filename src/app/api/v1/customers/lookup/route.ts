import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/rbac'
import type { ApiResponse, SessionUser } from '@/types'

export const dynamic = 'force-dynamic'

async function getHandler(
  req: NextRequest,
  { user: _user }: { params: Record<string, string>; user: SessionUser }
) {
  const { searchParams } = new URL(req.url)
  const phone = searchParams.get('phone')?.trim()

  if (!phone || phone.length < 4) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'phone query param is required (min 4 chars)' },
      { status: 400 }
    )
  }

  // Find the most recently-used customer with this phone prefix
  const customer = await prisma.customer.findFirst({
    where: {
      phone: { startsWith: phone },
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      phone: true,
      address: true,
    },
  })

  if (!customer) {
    return new NextResponse(null, { status: 204 })
  }

  return NextResponse.json<ApiResponse<typeof customer>>({
    success: true,
    data: customer,
  })
}

export const GET = withRole(['admin', 'manager', 'staff'], getHandler)
