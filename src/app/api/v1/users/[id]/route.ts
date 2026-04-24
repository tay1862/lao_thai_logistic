import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/rbac'
import { writeAuditLog } from '@/lib/audit'
import type { ApiResponse, SessionUser } from '@/types'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }>; user: SessionUser }

const USER_SELECT = {
  id: true,
  firstname: true,
  lastname: true,
  email: true,
  role: true,
  status: true,
  branchId: true,
  createdAt: true,
  branch: { select: { branchName: true } },
} as const

const UpdateSchema = z.object({
  firstname: z.string().trim().min(1).max(100).optional(),
  lastname: z.string().trim().min(1).max(100).optional(),
  role: z.enum(['admin', 'manager', 'staff']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  branchId: z.string().trim().min(3).max(80).nullable().optional(),
  password: z.string().min(6).max(128).optional(),
})

async function patchHandler(req: NextRequest, { params, user }: Ctx) {
  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'admin.userCrud.api.invalidJson' },
      { status: 400 }
    )
  }

  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'admin.userCrud.api.invalidInput' },
      { status: 400 }
    )
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      role: true,
      status: true,
      branchId: true,
    },
  })

  if (!existing) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'admin.userCrud.api.userNotFound' },
      { status: 404 }
    )
  }

  const data = parsed.data

  if (id === user.id && data.status === 'inactive') {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'admin.userCrud.api.cannotDeactivateSelf' },
      { status: 422 }
    )
  }

  const updateData: Record<string, unknown> = {}
  if (typeof data.firstname !== 'undefined') updateData.firstname = data.firstname
  if (typeof data.lastname !== 'undefined') updateData.lastname = data.lastname
  if (typeof data.role !== 'undefined') updateData.role = data.role
  if (typeof data.status !== 'undefined') updateData.status = data.status
  if (typeof data.branchId !== 'undefined') updateData.branchId = data.branchId
  if (typeof data.password !== 'undefined') {
    updateData.passwordHash = await bcrypt.hash(data.password, 12)
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: USER_SELECT,
  })

  await writeAuditLog(user.id, 'USER_UPDATED', 'User', updated.id, {
    firstname: existing.firstname,
    lastname: existing.lastname,
    role: existing.role,
    status: existing.status,
    branchId: existing.branchId,
  }, {
    firstname: updated.firstname,
    lastname: updated.lastname,
    role: updated.role,
    status: updated.status,
    branchId: updated.branchId,
  })

  return NextResponse.json<ApiResponse<typeof updated>>({ success: true, data: updated })
}

async function deleteHandler(_req: NextRequest, { params, user }: Ctx) {
  const { id } = await params

  if (id === user.id) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'admin.userCrud.api.cannotDeleteSelf' },
      { status: 422 }
    )
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, status: true },
  })

  if (!existing) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'admin.userCrud.api.userNotFound' },
      { status: 404 }
    )
  }

  await prisma.user.update({
    where: { id },
    data: { status: 'inactive' },
  })

  await writeAuditLog(user.id, 'USER_DEACTIVATED', 'User', id, { status: existing.status }, { status: 'inactive' })

  return NextResponse.json<ApiResponse<{ id: string; status: string }>>({
    success: true,
    data: { id, status: 'inactive' },
  })
}

export const PATCH = withRole(['admin'], patchHandler)
export const DELETE = withRole(['admin'], deleteHandler)
