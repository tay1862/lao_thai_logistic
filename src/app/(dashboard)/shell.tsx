'use client'

import { MobileBottomNav, Sidebar, Topbar } from '@/components/layout/sidebar'
import type { SessionUser } from '@/types'

interface DashboardShellProps {
  user: SessionUser
  children: React.ReactNode
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const fullName = `${user.firstname} ${user.lastname}`

  return (
    <div className="flex min-h-dvh bg-transparent text-foreground">
      <Sidebar
        userRole={user.role}
        userName={fullName}
        branchName={user.branchName}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar userRole={user.role} branchName={user.branchName} />

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="page-shell safe-px mobile-safe-pb py-5 md:py-6">
            {children}
          </div>
        </main>
      </div>

      <MobileBottomNav
        userRole={user.role}
        userName={fullName}
        branchName={user.branchName}
      />
    </div>
  )
}
