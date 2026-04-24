'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/ui/status-badge'
import { useI18n } from '@/lib/i18n'
import { ALLOWED_TRANSITIONS } from '@/lib/shipment-status'
import type { ShipmentStatus } from '@/types'

interface Props {
  shipmentId: string
  currentStatus: ShipmentStatus
}

export function StatusUpdateForm({ shipmentId, currentStatus }: Props) {
  const router = useRouter()
  const { t } = useI18n()
  const nextStatuses = ALLOWED_TRANSITIONS[currentStatus]
  const [status, setStatus] = useState<ShipmentStatus | ''>(nextStatuses[0] ?? '')
  const [location, setLocation] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!status) {
      setError(t('scan.noTransitions'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/v1/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, location, note }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        const message = data.error ?? t('shipments.errors.updateFailed')
        setError(message)
        toast.error(message)
        return
      }
      toast.success(t('shipments.detail.updateStatus'))
      router.refresh()
    } catch {
      const message = t('common.serverError')
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="surface-muted p-4">
        <p className="data-label">{t('tracking.currentStatus')}</p>
        <div className="mt-2">
          <StatusBadge status={currentStatus} className="px-3 py-1.5 text-sm" />
        </div>
      </div>

      <div className="field-stack">
        <Label htmlFor="status-update-select">{t('scan.newStatus')}</Label>
        <select
          id="status-update-select"
          className="h-12 w-full rounded-xl border border-input bg-white px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={status}
          onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
          disabled={nextStatuses.length === 0}
        >
          {nextStatuses.length === 0 ? (
            <option value="">{t('scan.noTransitions')}</option>
          ) : (
            nextStatuses.map((option) => (
              <option key={option} value={option}>
                {t(`status.${option}`)}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="field-stack">
        <Label htmlFor="status-location">{t('shipments.detail.location')}</Label>
        <Input
          id="status-location"
          className="h-12 rounded-xl bg-white px-4"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t('shipments.detail.location')}
        />
      </div>

      <div className="field-stack">
        <Label htmlFor="status-note">{t('shipments.detail.note')}</Label>
        <Textarea
          id="status-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('shipments.detail.note')}
          className="rounded-xl bg-white px-4 py-3"
        />
      </div>

      {error && (
        <div className="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--brand-danger)]">
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading || nextStatuses.length === 0} size="lg" className="h-12 w-full rounded-xl">
        {loading ? t('common.loading') : t('shipments.detail.updateStatus')}
      </Button>
    </form>
  )
}
