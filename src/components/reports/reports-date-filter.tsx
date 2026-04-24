'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { useI18n } from '@/lib/i18n'

interface Props {
  dateFrom?: string
  dateTo?: string
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function ReportsDateFilter({ dateFrom, dateTo }: Props) {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [from, setFrom] = useState<Date | undefined>(dateFrom ? new Date(dateFrom) : undefined)
  const [to, setTo] = useState<Date | undefined>(dateTo ? new Date(dateTo) : undefined)
  const [fromOpen, setFromOpen] = useState(false)
  const [toOpen, setToOpen] = useState(false)

  function apply() {
    const params = new URLSearchParams(searchParams.toString())
    if (from) params.set('dateFrom', from.toISOString().split('T')[0])
    else params.delete('dateFrom')
    if (to) params.set('dateTo', to.toISOString().split('T')[0])
    else params.delete('dateTo')
    router.push(`?${params.toString()}`)
  }

  function clear() {
    setFrom(undefined)
    setTo(undefined)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('dateFrom')
    params.delete('dateTo')
    router.push(`?${params.toString()}`)
  }

  const hasFilter = !!(dateFrom || dateTo)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm font-medium text-foreground">{t('reports.dateFilter')}</p>

      <Popover open={fromOpen} onOpenChange={setFromOpen}>
        <PopoverTrigger className="inline-flex h-9 items-center gap-2 rounded-xl border border-input bg-white px-3 text-sm font-medium text-foreground hover:bg-muted">
          <Icon id="calendar" size={14} />
          {from ? formatDate(from.toISOString()) : t('reports.dateFrom')}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={from}
            onSelect={(d) => { setFrom(d); setFromOpen(false) }}
            disabled={(d) => to ? d > to : false}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground text-sm">→</span>

      <Popover open={toOpen} onOpenChange={setToOpen}>
        <PopoverTrigger className="inline-flex h-9 items-center gap-2 rounded-xl border border-input bg-white px-3 text-sm font-medium text-foreground hover:bg-muted">
          <Icon id="calendar" size={14} />
          {to ? formatDate(to.toISOString()) : t('reports.dateTo')}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={to}
            onSelect={(d) => { setTo(d); setToOpen(false) }}
            disabled={(d) => from ? d < from : false}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button size="sm" className="h-9 rounded-xl px-4" onClick={apply}>
        {t('reports.dateApply')}
      </Button>

      {hasFilter && (
        <Button variant="ghost" size="sm" className="h-9 rounded-xl px-3 text-muted-foreground" onClick={clear}>
          {t('reports.dateClear')}
        </Button>
      )}

      {hasFilter && (
        <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-medium text-[var(--brand-primary)]">
          {t('reports.dateFilter')}
        </span>
      )}
    </div>
  )
}
