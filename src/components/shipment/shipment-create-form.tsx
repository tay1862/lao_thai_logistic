'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Icon } from '@/components/ui/icon'
import { useI18n } from '@/lib/i18n'

const SHIPPING_PARTNERS = ['internal', 'thailand_post', 'lao_post', 'flash', 'jnt', 'kerry', 'other'] as const

type Branch = { id: string; branchName: string; country: 'TH' | 'LA'; currency: 'THB' | 'LAK' }

interface Props {
  branches: Branch[]
  userRole: 'admin' | 'manager' | 'staff'
  userBranchId: string | null
}

export function ShipmentCreateForm({ branches, userRole, userBranchId }: Props) {
  const router = useRouter()
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [priceType, setPriceType] = useState<'calculated' | 'manual'>('calculated')

  const defaultOrigin = useMemo(() => {
    if (userRole === 'staff' && userBranchId) return userBranchId
    return branches[0]?.id ?? ''
  }, [branches, userRole, userBranchId])

  const [form, setForm] = useState({
    senderFirstname: '',
    senderLastname: '',
    senderPhone: '',
    senderAddress: '',
    receiverFirstname: '',
    receiverLastname: '',
    receiverPhone: '',
    receiverAddress: '',
    originBranchId: defaultOrigin,
    destinationBranchId: branches.find((b) => b.id !== defaultOrigin)?.id ?? branches[0]?.id ?? '',
    weightKg: '1',
    itemDescription: '',
    codAmount: '0',
    priceType: 'calculated',
    manualPrice: '',
    manualPriceNote: '',
    externalTrackingNo: '',
    shippingPartner: '',
  })

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        ...form,
        weightKg: Number(form.weightKg),
        codAmount: Number(form.codAmount || 0),
        priceType,
        manualPrice: priceType === 'manual' ? Number(form.manualPrice) : undefined,
        externalTrackingNo: form.externalTrackingNo.trim() || undefined,
        shippingPartner: form.shippingPartner || undefined,
      }

      const res = await fetch('/api/v1/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        const message = data.error ?? t('shipments.errors.createFailed')
        setError(message)
        toast.error(message)
        return
      }

      toast.success(t('shipments.form.submit'))
      router.replace(`/dashboard/shipments/${data.data.id}`)
      router.refresh()
    } catch {
      setError(t('common.serverError'))
      toast.error(t('common.serverError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t('shipments.form.senderFirst')}</Label>
          <Input value={form.senderFirstname} onChange={(e) => update('senderFirstname', e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>{t('shipments.form.senderLast')}</Label>
          <Input value={form.senderLastname} onChange={(e) => update('senderLastname', e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>{t('shipments.form.senderPhone')}</Label>
          <Input value={form.senderPhone} onChange={(e) => update('senderPhone', e.target.value)} required />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>{t('shipments.form.senderAddress')}</Label>
          <Textarea value={form.senderAddress} onChange={(e) => update('senderAddress', e.target.value)} rows={2} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t('shipments.form.receiverFirst')}</Label>
          <Input value={form.receiverFirstname} onChange={(e) => update('receiverFirstname', e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>{t('shipments.form.receiverLast')}</Label>
          <Input value={form.receiverLastname} onChange={(e) => update('receiverLastname', e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>{t('shipments.form.receiverPhone')}</Label>
          <Input value={form.receiverPhone} onChange={(e) => update('receiverPhone', e.target.value)} required />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>{t('shipments.form.receiverAddress')}</Label>
          <Textarea value={form.receiverAddress} onChange={(e) => update('receiverAddress', e.target.value)} rows={2} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label>{t('shipments.form.originBranch')}</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
            value={form.originBranchId}
            onChange={(e) => update('originBranchId', e.target.value)}
            disabled={userRole === 'staff'}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.branchName}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>{t('shipments.form.destinationBranch')}</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
            value={form.destinationBranchId}
            onChange={(e) => update('destinationBranchId', e.target.value)}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.branchName}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>{t('shipments.form.weight')}</Label>
          <Input type="number" min="0.1" step="0.1" value={form.weightKg} onChange={(e) => update('weightKg', e.target.value)} required />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label>{t('shipments.form.cod')}</Label>
          <Input type="number" min="0" value={form.codAmount} onChange={(e) => update('codAmount', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t('shipments.form.priceType')}</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
            value={priceType}
            onChange={(e) => {
              const value = e.target.value as 'calculated' | 'manual'
              setPriceType(value)
              update('priceType', value)
            }}
          >
            <option value="calculated">{t('shipments.form.autoPrice')}</option>
            <option value="manual">{t('shipments.form.manualPrice')}</option>
          </select>
        </div>
        {priceType === 'manual' && (
          <div className="space-y-1.5">
            <Label>{t('shipments.form.manualPrice')}</Label>
            <Input type="number" min="1" value={form.manualPrice} onChange={(e) => update('manualPrice', e.target.value)} required={priceType === 'manual'} />
          </div>
        )}
      </div>

      {priceType === 'manual' && (
        <div className="space-y-1.5">
          <Label>{t('shipments.form.manualReason')}</Label>
          <Textarea value={form.manualPriceNote} onChange={(e) => update('manualPriceNote', e.target.value)} rows={2} />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t('shipments.form.shippingPartner')}</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
            value={form.shippingPartner}
            onChange={(e) => update('shippingPartner', e.target.value)}
          >
            <option value="">{t('shipments.form.noPartner')}</option>
            {SHIPPING_PARTNERS.map((partner) => (
              <option key={partner} value={partner}>{t(`partners.${partner}`)}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>{t('shipments.form.externalTrackingNo')}</Label>
          <Input value={form.externalTrackingNo} onChange={(e) => update('externalTrackingNo', e.target.value)} placeholder={t('shipments.form.externalTrackingPlaceholder')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{t('shipments.form.itemDescription')}</Label>
        <Textarea value={form.itemDescription} onChange={(e) => update('itemDescription', e.target.value)} rows={2} />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
          <Icon id="alert" size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="min-w-36">
          {loading ? t('shipments.form.submitting') : t('shipments.form.submit')}
        </Button>
      </div>
    </form>
  )
}
