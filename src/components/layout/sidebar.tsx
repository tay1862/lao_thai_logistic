'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'
import { Icon } from '@/components/ui/icon'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  icon: string
  labelKey: string
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',              icon: 'home',      labelKey: 'nav.overview' },
  { href: '/dashboard/shipments',    icon: 'package',   labelKey: 'nav.shipments' },
  { href: '/dashboard/scan',         icon: 'scan',      labelKey: 'nav.scan' },
  { href: '/dashboard/cod',          icon: 'banknote',  labelKey: 'nav.cod', roles: ['admin','manager','staff'] },
  { href: '/dashboard/reports',      icon: 'chart',     labelKey: 'nav.reports', roles: ['admin','manager'] },
  { href: '/dashboard/admin',        icon: 'settings',  labelKey: 'nav.settings', roles: ['admin'] },
]

interface SidebarNavProps {
  userRole: string
  onNavigate?: () => void
}

export function SidebarNav({ userRole, onNavigate }: SidebarNavProps) {
  const pathname = usePathname()
  const { t } = useI18n()

  const items = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  )

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors touch-target',
              active
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            )}
          >
            <Icon id={item.icon} size={20} />
            <span>{t(item.labelKey)}</span>
          </Link>
        )
      })}
    </nav>
  )
}

interface MobileBottomNavProps {
  userRole: string
}

export function MobileBottomNav({ userRole }: MobileBottomNavProps) {
  const pathname = usePathname()
  const { t } = useI18n()

  const items = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  ).slice(0, 5) // max 5 items on mobile

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-white shadow-lg md:hidden">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center py-2 text-xs font-medium transition-colors touch-target',
              active ? 'text-[var(--brand-primary)]' : 'text-muted-foreground'
            )}
          >
            <Icon id={item.icon} size={22} />
            <span className="mt-0.5">{t(item.labelKey)}</span>
          </Link>
        )
      })}
    </nav>
  )
}

interface SidebarProps {
  userRole: string
  userName: string
  branchName: string | null
  open: boolean
  onClose: () => void
}

export function Sidebar({ userRole, userName, branchName, open, onClose }: SidebarProps) {
  const router = useRouter()
  const { t } = useI18n()

  async function handleLogout() {
    await fetch('/api/v1/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-50 w-64 flex flex-col transition-transform duration-300',
          'md:relative md:translate-x-0 md:z-auto md:flex',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ backgroundColor: 'var(--brand-primary-dark)' }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--brand-primary-light)' }}
          >
            <Icon id="truck" size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-tight truncate">Thai-Lao Logistic</p>
            {branchName && (
              <p className="text-white/60 text-xs truncate">{branchName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-white/60 hover:text-white md:hidden"
            aria-label={t('common.cancel')}
          >
            <Icon id="x" size={20} />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto">
          <SidebarNav userRole={userRole} onNavigate={onClose} />
        </div>

        {/* User footer */}
        <div className="border-t border-white/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Icon id="users" size={16} />
            <span className="truncate">{userName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Icon id="logout" size={16} />
            <span>{t('common.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  )
}

interface TopbarProps {
  onMenuClick: () => void
  title?: string
}

export function Topbar({ onMenuClick, title }: TopbarProps) {
  const pathname = usePathname()
  const { t } = useI18n()
  const sectionTitle = useMemo(() => {
    const found = NAV_ITEMS.find((item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))
    return found ? t(found.labelKey) : title
  }, [pathname, t, title])

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white px-4 shadow-sm"
    >
      <button
        onClick={onMenuClick}
        className="touch-target flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors md:hidden"
        aria-label={t('nav.settings')}
      >
        <Icon id="menu" size={22} />
      </button>
      {sectionTitle && (
        <h1 className="text-base font-semibold text-foreground truncate">{sectionTitle}</h1>
      )}
      <div className="ml-auto flex items-center gap-2">
        <LocaleSwitcher />
        <div
          className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          TL
        </div>
      </div>
    </header>
  )
}
