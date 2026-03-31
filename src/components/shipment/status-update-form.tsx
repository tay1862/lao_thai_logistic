'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/lib/i18n'
import type { ShipmentStatus } from '@/types'

const STATUS_OPTIONS: { value: ShipmentStatus; labelKey: string }[] = [
  { value: 'in_transit', labelKey: 'status.in_transit' },
  { value: 'arrived_hub', labelKey: 'status.arrived_hub' },
  { value: 'out_for_delivery', labelKey: 'status.out_for_delivery' },
  { value: 'delivered', labelKey: 'status.delivered' },
  { value: 'failed_delivery', labelKey: 'status.failed_delivery' },
  { value: 'return_in_transit', labelKey: 'status.return_in_transit' },
  { value: 'returned', labelKey: 'status.returned' },
  { value: 'cancelled', labelKey: 'status.cancelled' },
]

interface Props {
  shipmentId: string
}

export function StatusUpdateForm({ shipmentId }: Props) {
  const router = useRouter()
  const { t } = useI18n()
  const [status, setStatus] = useState<ShipmentStatus>('in_transit')
  const [location, setLocation] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
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
        setError(data.error ?? t('shipments.errors.updateFailed'))
        toast.error(data.error ?? t('shipments.errors.updateFailed'))
        return
      }
      toast.success(t('shipments.detail.updateStatus'))
      router.refresh()
    } catch {
      setError(t('common.serverError'))
      toast.error(t('common.serverError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>{t('shipments.detail.updateStatus')}</Label>
        <select
          className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{t(s.labelKey)}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>{t('shipments.detail.location')}</Label>
        <input
          className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t('shipments.detail.location')}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t('shipments.detail.note')}</Label>
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('shipments.detail.note')} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t('common.loading') : t('shipments.detail.updateStatus')}
      </Button>
    </form>
  )
}
