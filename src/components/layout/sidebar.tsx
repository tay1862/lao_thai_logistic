'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  icon: string
  labelKey: string
  roles?: string[]
  mobilePrimary?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', icon: 'home', labelKey: 'nav.overview', mobilePrimary: true },
  { href: '/dashboard/shipments', icon: 'package', labelKey: 'nav.shipments', mobilePrimary: true },
  { href: '/dashboard/scan', icon: 'scan', labelKey: 'nav.scan', mobilePrimary: true },
  { href: '/dashboard/cod', icon: 'banknote', labelKey: 'nav.cod', roles: ['admin', 'manager', 'staff'], mobilePrimary: true },
  { href: '/dashboard/reports', icon: 'chart', labelKey: 'nav.reports', roles: ['admin', 'manager'] },
  { href: '/dashboard/admin', icon: 'settings', labelKey: 'nav.settings', roles: ['admin'] },
]

function itemIsActive(pathname: string, href: string) {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
}

function getVisibleItems(userRole: string) {
  return NAV_ITEMS
    .filter((item) => !item.roles || item.roles.includes(userRole))
    // UX-22: Reports is mobilePrimary for manager role
    .map((item) => {
      if (item.href === '/dashboard/reports' && userRole === 'manager') {
        return { ...item, mobilePrimary: true }
      }
      return item
    })
}

async function logout(router: ReturnType<typeof useRouter>) {
  await fetch('/api/v1/auth/logout', { method: 'POST' })
  window.location.assign('/login')
}

interface SidebarNavProps {
  userRole: string
  compact?: boolean
  onNavigate?: () => void
}

function SidebarNav({ userRole, compact = false, onNavigate }: SidebarNavProps) {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <nav className={cn('flex flex-col gap-2', compact && 'gap-1.5')}>
      {getVisibleItems(userRole).map((item) => {
        const active = itemIsActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'touch-target group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition-all',
              compact ? 'rounded-xl py-2.5' : '',
              active
                ? 'border-white/20 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                : 'border-transparent text-white/72 hover:border-white/12 hover:bg-white/8 hover:text-white'
            )}
          >
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-2xl transition-colors',
                compact ? 'h-9 w-9 rounded-xl' : '',
                active ? 'bg-white/14 text-white' : 'bg-white/6 text-white/80 group-hover:bg-white/10'
              )}
            >
              <Icon id={item.icon} size={compact ? 18 : 20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('truncate font-medium', compact && 'text-[0.9rem]')}>
                {t(item.labelKey)}
              </p>
            </div>
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
}

export function Sidebar({ userRole, userName, branchName }: SidebarProps) {
  const router = useRouter()
  const { t } = useI18n()

  return (
    <aside className="hidden min-h-dvh w-[18rem] shrink-0 border-r border-[var(--brand-sidebar-border)] bg-[linear-gradient(180deg,rgba(16,33,61,0.98),rgba(12,24,44,0.98))] text-white md:flex md:flex-col">
      <div className="px-5 pt-5">
        <div className="rounded-[1.75rem] border border-white/12 bg-white/6 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 text-white">
              <Icon id="truck" size={24} aria-label="Thai-Lao Logistic" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/58">
                {t('common.brand')}
              </p>
              <h2 className="mt-1 font-heading text-xl font-semibold leading-tight">
                {t('sidebar.operations')}
              </h2>
              <p className="mt-2 text-sm text-white/64">
                {branchName ?? t('common.allBranches')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5">
        <SidebarNav userRole={userRole} />
      </div>

      <div className="mt-auto px-4 pb-4 pt-2">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/56">
            {t('sidebar.currentUser')}
          </p>
          <p className="mt-2 truncate font-medium text-white">{userName}</p>
          <p className="mt-1 truncate text-sm text-white/60">{branchName ?? t('common.allBranches')}</p>
          <div className="mt-4">
            <Button
              variant="secondary"
              className="h-11 w-full justify-start rounded-xl bg-white/12 text-white hover:bg-white/16 hover:text-white"
              onClick={() => logout(router)}
            >
              <Icon id="logout" size={16} className="mr-2" />
              {t('common.logout')}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}

interface MobileBottomNavProps {
  userRole: string
  userName: string
  branchName: string | null
}

export function MobileBottomNav({ userRole, userName, branchName }: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useI18n()
  const [moreOpen, setMoreOpen] = useState(false)
  const visibleItems = getVisibleItems(userRole)
  const primaryItems = visibleItems.filter((item) => item.mobilePrimary).slice(0, 4)
  const extraItems = visibleItems.filter((item) => !primaryItems.some((primary) => primary.href === item.href))
  const moreActive = extraItems.some((item) => itemIsActive(pathname, item.href))

  return (
    <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-white/92 shadow-[0_-18px_45px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
        style={{ paddingBottom: 'max(0.55rem, env(safe-area-inset-bottom))' }}
      >
        <div className="grid grid-cols-5 gap-1 px-2 pt-2">
          {primaryItems.map((item) => {
            const active = itemIsActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'touch-target flex min-h-[4.35rem] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[0.68rem] font-medium transition-colors',
                  active ? 'bg-[var(--brand-soft)] text-[var(--brand-primary)]' : 'text-muted-foreground'
                )}
              >
                <Icon id={item.icon} size={20} />
                <span className="truncate">{t(item.labelKey)}</span>
              </Link>
            )
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            aria-label={t('nav.more')}
            className={cn(
              'touch-target flex min-h-[4.35rem] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[0.68rem] font-medium transition-colors',
              moreActive || moreOpen ? 'bg-[var(--brand-soft)] text-[var(--brand-primary)]' : 'text-muted-foreground'
            )}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/80 bg-white text-current">
              <Icon id="menu" size={18} />
            </span>
            <span className="truncate">{t('nav.more')}</span>
          </button>
        </div>
      </nav>

      <SheetContent side="bottom" className="rounded-t-[1.75rem] border-x border-t border-border/80 px-0 pb-6">
        <SheetHeader className="px-5 pt-5">
          <SheetTitle>{t('sidebar.workspaceMenu')}</SheetTitle>
          <SheetDescription>{t('sidebar.workspaceMenuHelp')}</SheetDescription>
        </SheetHeader>

        <div className="px-5">
          <div className="surface-muted p-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t('sidebar.currentUser')}
            </p>
            <p className="mt-2 font-medium text-foreground">{userName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{branchName ?? t('common.allBranches')}</p>
          </div>
        </div>

        <div className="mt-4 px-5">
          <SidebarNav userRole={userRole} compact onNavigate={() => setMoreOpen(false)} />
        </div>

        <div className="mt-4 px-5">
          <div className="surface-muted p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t('language.label')}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{t('sidebar.localeHelp')}</p>
              </div>
              <LocaleSwitcher />
            </div>
            <Button
              variant="outline"
              className="mt-4 h-11 w-full justify-center rounded-xl"
              onClick={() => logout(router)}
            >
              <Icon id="logout" size={16} className="mr-2" />
              {t('common.logout')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface TopbarProps {
  userRole: string
  branchName: string | null
}

export function Topbar({ userRole, branchName }: TopbarProps) {
  const pathname = usePathname()
  const { t } = useI18n()

  const activeItem = getVisibleItems(userRole).find((item) => itemIsActive(pathname, item.href))
  const title = activeItem ? t(activeItem.labelKey) : t('common.brand')

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-white/84 backdrop-blur">
      <div className="page-shell safe-px flex h-[4.75rem] items-center gap-3">
        <div className="min-w-0">
          {/* UX-21: On mobile only show brand + branch, not page title */}
          <p className="truncate text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="md:hidden">{t('common.brand')}</span>
            <span className="hidden md:inline">{branchName ?? t('common.allBranches')}</span>
          </p>
          <h1 className="truncate font-heading text-lg font-semibold text-foreground md:text-xl">
            <span className="md:hidden">{branchName ?? t('common.allBranches')}</span>
            <span className="hidden md:inline">{title}</span>
          </h1>
        </div>

        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <span className="rounded-full border border-border/80 bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-primary-strong)]">
            {t(`admin.userCrud.roles.${userRole}`)}
          </span>
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  )
}
