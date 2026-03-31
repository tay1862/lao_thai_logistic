'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@/components/ui/icon'
import { useI18n } from '@/lib/i18n'

const STATUS_OPTIONS = [
  'in_transit',
  'arrived_hub',
  'out_for_delivery',
  'delivered',
  'failed_delivery',
  'return_in_transit',
  'returned',
  'cancelled',
] as const

export default function ScanPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [trackingNo, setTrackingNo] = useState('')
  const [status, setStatus] = useState('in_transit')
  const [location, setLocation] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [foundId, setFoundId] = useState('')

  async function searchShipment() {
    if (!trackingNo.trim()) return
    setError('')
    setFoundId('')

    const res = await fetch(`/api/v1/shipments?q=${encodeURIComponent(trackingNo)}&pageSize=1`)
    const data = await res.json()
    if (!res.ok || !data.success || data.data.length === 0) {
      setError(t('shipments.notFound'))
      toast.error(t('shipments.notFound'))
      return
    }
    setFoundId(data.data[0].id)
    toast.success(t('scan.found'))
  }

  async function updateStatus(e: React.FormEvent) {
    e.preventDefault()
    if (!foundId) {
      setError(t('scan.searchTitle'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/v1/shipments/${foundId}`, {
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
      toast.success(t('scan.save'))
      router.push(`/dashboard/shipments/${foundId}`)
      router.refresh()
    } catch {
      setError(t('common.serverError'))
      toast.error(t('common.serverError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{t('scan.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('scan.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('scan.searchTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
              placeholder={t('scan.trackingPlaceholder')}
            />
            <Button type="button" onClick={searchShipment}>
              <Icon id="search" size={16} className="mr-1" />
              {t('common.search')}
            </Button>
          </div>
          {foundId && <p className="text-sm text-green-700">{t('scan.found')}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('scan.updateTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={updateStatus} className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t('scan.newStatus')}</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>{t(`status.${option}`)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>{t('scan.location')}</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('scan.location')} />
            </div>

            <div className="space-y-1.5">
              <Label>{t('scan.note')}</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('scan.note')} />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t('scan.saving') : t('scan.save')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
