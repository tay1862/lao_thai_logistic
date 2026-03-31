'use client'

import { useState } from 'react'
import { Sidebar, MobileBottomNav, Topbar } from '@/components/layout/sidebar'
import type { SessionUser } from '@/types'

interface DashboardShellProps {
  user: SessionUser
  children: React.ReactNode
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const fullName = `${user.firstname} ${user.lastname}`

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar (desktop: always visible, mobile: drawer) */}
      <Sidebar
        userRole={user.role}
        userName={fullName}
        branchName={user.branchName}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 pb-20 md:pb-6 md:p-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav userRole={user.role} />
    </div>
  )
}
