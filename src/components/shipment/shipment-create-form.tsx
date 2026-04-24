'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Icon } from '@/components/ui/icon'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const SHIPPING_PARTNERS = ['internal', 'thailand_post', 'lao_post', 'flash', 'jnt', 'kerry', 'other'] as const

type Branch = { id: string; branchName: string; country: 'TH' | 'LA'; currency: 'THB' | 'LAK' }
type FormState = {
  senderFirstname: string
  senderLastname: string
  senderPhone: string
  senderAddress: string
  receiverFirstname: string
  receiverLastname: string
  receiverPhone: string
  receiverAddress: string
  originBranchId: string
  destinationBranchId: string
  weightKg: string
  itemDescription: string
  codAmount: string
  priceType: 'calculated' | 'manual'
  manualPrice: string
  manualPriceNote: string
  externalTrackingNo: string
  shippingPartner: string
}

interface Props {
  branches: Branch[]
  userRole: 'admin' | 'manager' | 'staff'
  userBranchId: string | null
}

export function ShipmentCreateForm({ branches, userRole, userBranchId }: Props) {
  const router = useRouter()
  const { t } = useI18n()
  const defaultOrigin = userRole === 'staff' && userBranchId ? userBranchId : (branches[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  // UX-09: Progress step tracking
  const [activeStep, setActiveStep] = useState(0)
  const steps = [
    t('shipments.form.progressStep1'),
    t('shipments.form.progressStep2'),
    t('shipments.form.progressStep3'),
    t('shipments.form.progressStep4'),
  ]

  // UX-08: Address collapsible
  const [showSenderAddress, setShowSenderAddress] = useState(false)
  const [showReceiverAddress, setShowReceiverAddress] = useState(false)

  // UX-05: Phone lookup refs and state
  const senderLookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const receiverLookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [senderLookupFound, setSenderLookupFound] = useState(false)
  const [receiverLookupFound, setReceiverLookupFound] = useState(false)

  const [form, setForm] = useState<FormState>({
    senderFirstname: '',
    senderLastname: '',
    senderPhone: '',
    senderAddress: '',
    receiverFirstname: '',
    receiverLastname: '',
    receiverPhone: '',
    receiverAddress: '',
    originBranchId: defaultOrigin,
    destinationBranchId: branches.find((branch) => branch.id !== defaultOrigin)?.id ?? branches[0]?.id ?? '',
    weightKg: '1',
    itemDescription: '',
    codAmount: '0',
    priceType: 'calculated',
    manualPrice: '',
    manualPriceNote: '',
    externalTrackingNo: '',
    shippingPartner: '',
  })

  const originBranch = branches.find((branch) => branch.id === form.originBranchId) ?? null
  const destinationBranch = branches.find((branch) => branch.id === form.destinationBranchId) ?? null
  const codCurrency = originBranch?.currency ?? 'THB'

  // UX-05: Phone lookup with 300ms debounce
  const lookupPhone = useCallback(async (phone: string, role: 'sender' | 'receiver') => {
    if (phone.length < 4) return
    try {
      const res = await fetch(`/api/v1/customers/lookup?phone=${encodeURIComponent(phone)}`)
      if (res.status === 204) return
      const data = await res.json()
      if (!data.success || !data.data) return
      const customer = data.data as { firstname: string; lastname: string; address?: string; phone: string }
      if (role === 'sender') {
        setForm((prev) => ({
          ...prev,
          senderFirstname: customer.firstname,
          senderLastname: customer.lastname,
          senderAddress: customer.address ?? prev.senderAddress,
        }))
        setSenderLookupFound(true)
        if (customer.address) setShowSenderAddress(true)
      } else {
        setForm((prev) => ({
          ...prev,
          receiverFirstname: customer.firstname,
          receiverLastname: customer.lastname,
          receiverAddress: customer.address ?? prev.receiverAddress,
        }))
        setReceiverLookupFound(true)
        if (customer.address) setShowReceiverAddress(true)
      }
    } catch {
      // silent — lookup is best-effort
    }
  }, [])

  function handleSenderPhoneChange(phone: string) {
    update('senderPhone', phone)
    setSenderLookupFound(false)
    if (senderLookupTimer.current) clearTimeout(senderLookupTimer.current)
    senderLookupTimer.current = setTimeout(() => lookupPhone(phone, 'sender'), 300)
  }

  function handleReceiverPhoneChange(phone: string) {
    update('receiverPhone', phone)
    setReceiverLookupFound(false)
    if (receiverLookupTimer.current) clearTimeout(receiverLookupTimer.current)
    receiverLookupTimer.current = setTimeout(() => lookupPhone(phone, 'receiver'), 300)
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (senderLookupTimer.current) clearTimeout(senderLookupTimer.current)
      if (receiverLookupTimer.current) clearTimeout(receiverLookupTimer.current)
    }
  }, [])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate() {
    const nextErrors: Partial<Record<keyof FormState, string>> = {}

    const requiredTextKeys: (keyof FormState)[] = [
      'senderFirstname',
      'senderLastname',
      'senderPhone',
      'receiverFirstname',
      'receiverLastname',
      'receiverPhone',
      'originBranchId',
      'destinationBranchId',
    ]

    requiredTextKeys.forEach((key) => {
      if (!form[key].trim()) {
        nextErrors[key] = t('shipments.form.required')
      }
    })

    if (Number(form.weightKg) <= 0) {
      nextErrors.weightKg = t('shipments.form.invalidWeight')
    }

    if (form.priceType === 'manual' && Number(form.manualPrice) <= 0) {
      nextErrors.manualPrice = t('shipments.form.invalidPrice')
    }

    if (form.originBranchId === form.destinationBranchId) {
      nextErrors.destinationBranchId = t('shipments.form.duplicateRoute')
    }

    if (form.shippingPartner && form.shippingPartner !== 'internal' && form.externalTrackingNo.trim() === '') {
      nextErrors.externalTrackingNo = t('shipments.form.partnerTrackingRequired')
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!validate()) {
      return
    }

    setLoading(true)

    try {
      const payload = {
        ...form,
        weightKg: Number(form.weightKg),
        codAmount: Number(form.codAmount || 0),
        priceType: form.priceType,
        manualPrice: form.priceType === 'manual' ? Number(form.manualPrice) : undefined,
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

        if (res.status === 409 && form.externalTrackingNo.trim()) {
          setFieldErrors((prev) => ({
            ...prev,
            externalTrackingNo: message,
          }))
        } else {
          setError(message)
        }

        toast.error(message)
        return
      }

      toast.success(t('shipments.form.submit'))
      router.replace(`/dashboard/shipments/${data.data.id}`)
      router.refresh()
    } catch {
      const message = t('common.serverError')
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  function renderFieldError(key: keyof FormState) {
    if (!fieldErrors[key]) return null
    return <p className="field-help text-[var(--brand-danger)]">{fieldErrors[key]}</p>
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(19rem,0.92fr)]">
      {/* UX-09: Progress indicator */}
      <div className="xl:col-span-2">
        <nav aria-label="Form steps" className="flex gap-1 overflow-x-auto pb-1">
          {steps.map((step, index) => (
            <button
              key={step}
              type="button"
              onClick={() => setActiveStep(index)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
                activeStep === index
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {index + 1}. {step}
            </button>
          ))}
        </nav>
      </div>

      <form id="shipment-create-form" onSubmit={onSubmit} className="page-stack">
        <section className="surface-panel p-4 sm:p-5">
          <div className="page-header gap-3">
            <div>
              <p className="metric-label">{t('shipments.detail.sender')}</p>
              <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground">
                {t('shipments.detail.sender')}
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="field-stack">
              <Label htmlFor="sender-firstname">{t('shipments.form.senderFirst')}</Label>
              <Input id="sender-firstname" value={form.senderFirstname} onChange={(e) => update('senderFirstname', e.target.value)} className="h-12 rounded-xl bg-white px-4" />
              {renderFieldError('senderFirstname')}
            </div>
            <div className="field-stack">
              <Label htmlFor="sender-lastname">{t('shipments.form.senderLast')}</Label>
              <Input id="sender-lastname" value={form.senderLastname} onChange={(e) => update('senderLastname', e.target.value)} className="h-12 rounded-xl bg-white px-4" />
              {renderFieldError('senderLastname')}
            </div>
            <div className="field-stack">
              <Label htmlFor="sender-phone">{t('shipments.form.senderPhone')}</Label>
              <div className="relative">
                <Input id="sender-phone" value={form.senderPhone} onChange={(e) => handleSenderPhoneChange(e.target.value)} className="h-12 rounded-xl bg-white px-4" />
                {senderLookupFound && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    {t('shipments.form.phoneLookupFound')}
                  </span>
                )}
              </div>
              <p className="field-help text-muted-foreground">{t('shipments.form.phoneLookupHint')}</p>
              {renderFieldError('senderPhone')}
            </div>
            {/* UX-08: Collapsible address */}
            {showSenderAddress ? (
              <div className="field-stack md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sender-address">{t('shipments.form.senderAddress')}</Label>
                  <button type="button" onClick={() => setShowSenderAddress(false)} className="text-xs text-muted-foreground hover:text-foreground">
                    {t('shipments.form.hideAddress')}
                  </button>
                </div>
                <Textarea id="sender-address" value={form.senderAddress} onChange={(e) => update('senderAddress', e.target.value)} rows={3} className="rounded-xl bg-white px-4 py-3" />
              </div>
            ) : (
              <div className="md:col-span-2">
                <button type="button" onClick={() => setShowSenderAddress(true)} className="text-sm text-muted-foreground hover:text-foreground">
                  {t('shipments.form.addAddress')}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="surface-panel p-4 sm:p-5">
          <div className="page-header gap-3">
            <div>
              <p className="metric-label">{t('shipments.detail.receiver')}</p>
              <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground">
                {t('shipments.detail.receiver')}
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="field-stack">
              <Label htmlFor="receiver-firstname">{t('shipments.form.receiverFirst')}</Label>
              <Input id="receiver-firstname" value={form.receiverFirstname} onChange={(e) => update('receiverFirstname', e.target.value)} className="h-12 rounded-xl bg-white px-4" />
              {renderFieldError('receiverFirstname')}
            </div>
            <div className="field-stack">
              <Label htmlFor="receiver-lastname">{t('shipments.form.receiverLast')}</Label>
              <Input id="receiver-lastname" value={form.receiverLastname} onChange={(e) => update('receiverLastname', e.target.value)} className="h-12 rounded-xl bg-white px-4" />
              {renderFieldError('receiverLastname')}
            </div>
            <div className="field-stack">
              <Label htmlFor="receiver-phone">{t('shipments.form.receiverPhone')}</Label>
              <div className="relative">
                <Input id="receiver-phone" value={form.receiverPhone} onChange={(e) => handleReceiverPhoneChange(e.target.value)} className="h-12 rounded-xl bg-white px-4" />
                {receiverLookupFound && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    {t('shipments.form.phoneLookupFound')}
                  </span>
                )}
              </div>
              <p className="field-help text-muted-foreground">{t('shipments.form.phoneLookupHint')}</p>
              {renderFieldError('receiverPhone')}
            </div>
            {/* UX-08: Collapsible address */}
            {showReceiverAddress ? (
              <div className="field-stack md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="receiver-address">{t('shipments.form.receiverAddress')}</Label>
                  <button type="button" onClick={() => setShowReceiverAddress(false)} className="text-xs text-muted-foreground hover:text-foreground">
                    {t('shipments.form.hideAddress')}
                  </button>
                </div>
                <Textarea id="receiver-address" value={form.receiverAddress} onChange={(e) => update('receiverAddress', e.target.value)} rows={3} className="rounded-xl bg-white px-4 py-3" />
              </div>
            ) : (
              <div className="md:col-span-2">
                <button type="button" onClick={() => setShowReceiverAddress(true)} className="text-sm text-muted-foreground hover:text-foreground">
                  {t('shipments.form.addAddress')}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="surface-panel p-4 sm:p-5">
          <div className="page-header gap-3">
            <div>
              <p className="metric-label">{t('tracking.route')}</p>
              <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground">
                {t('shipments.form.routeSection')}
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="field-stack">
              <Label htmlFor="origin-branch">{t('shipments.form.originBranch')}</Label>
              <select
                id="origin-branch"
                className="h-12 w-full rounded-xl border border-input bg-white px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:bg-muted"
                value={form.originBranchId}
                onChange={(e) => update('originBranchId', e.target.value)}
                disabled={userRole === 'staff'}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branchName} ({branch.country})
                  </option>
                ))}
              </select>
              {renderFieldError('originBranchId')}
            </div>

            <div className="field-stack">
              <Label htmlFor="destination-branch">{t('shipments.form.destinationBranch')}</Label>
              <select
                id="destination-branch"
                className="h-12 w-full rounded-xl border border-input bg-white px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={form.destinationBranchId}
                onChange={(e) => update('destinationBranchId', e.target.value)}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branchName} ({branch.country})
                  </option>
                ))}
              </select>
              {renderFieldError('destinationBranchId')}
            </div>

            <div className="field-stack">
              <Label htmlFor="weightKg">{t('shipments.form.weight')}</Label>
              <Input id="weightKg" type="number" min="0.1" step="0.1" value={form.weightKg} onChange={(e) => update('weightKg', e.target.value)} className="h-12 rounded-xl bg-white px-4" />
              {renderFieldError('weightKg')}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="field-stack">
              <Label htmlFor="cod-amount">{t('shipments.form.cod')}</Label>
              {/* UX-10: Currency label driven by originBranch */}
              <div className="flex items-center gap-2">
                <Input id="cod-amount" type="number" min="0" value={form.codAmount} onChange={(e) => update('codAmount', e.target.value)} className="h-12 rounded-xl bg-white px-4" />
                <span className="shrink-0 rounded-lg border border-border bg-muted px-3 py-1 text-sm font-semibold text-foreground">
                  {codCurrency}
                </span>
              </div>
            </div>

            <div className="field-stack">
              <Label htmlFor="price-type">{t('shipments.form.priceType')}</Label>
              <select
                id="price-type"
                className="h-12 w-full rounded-xl border border-input bg-white px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={form.priceType}
                onChange={(e) => update('priceType', e.target.value as FormState['priceType'])}
              >
                <option value="calculated">{t('shipments.form.autoPrice')}</option>
                <option value="manual">{t('shipments.form.manualPrice')}</option>
              </select>
            </div>

            {form.priceType === 'manual' && (
              <div className="field-stack">
                <Label htmlFor="manual-price">{t('shipments.form.manualPrice')}</Label>
                <Input id="manual-price" type="number" min="1" value={form.manualPrice} onChange={(e) => update('manualPrice', e.target.value)} className="h-12 rounded-xl bg-white px-4" />
                {renderFieldError('manualPrice')}
              </div>
            )}
          </div>

          {form.priceType === 'manual' && (
            <div className="field-stack mt-4">
              <Label htmlFor="manual-note">{t('shipments.form.manualReason')}</Label>
              <Textarea id="manual-note" value={form.manualPriceNote} onChange={(e) => update('manualPriceNote', e.target.value)} rows={3} className="rounded-xl bg-white px-4 py-3" />
            </div>
          )}
        </section>

        <section className="surface-panel p-4 sm:p-5">
          <div className="page-header gap-3">
            <div>
              <p className="metric-label">{t('shipments.detail.details')}</p>
              <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground">
                {t('shipments.form.packageSection')}
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="field-stack">
              <Label htmlFor="shipping-partner">{t('shipments.form.shippingPartner')}</Label>
              <select
                id="shipping-partner"
                className="h-12 w-full rounded-xl border border-input bg-white px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={form.shippingPartner}
                onChange={(e) => update('shippingPartner', e.target.value)}
              >
                <option value="">{t('shipments.form.noPartner')}</option>
                {SHIPPING_PARTNERS.map((partner) => (
                  <option key={partner} value={partner}>
                    {t(`partners.${partner}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-stack">
              <Label htmlFor="external-tracking">{t('shipments.form.externalTrackingNo')}</Label>
              <Input
                id="external-tracking"
                value={form.externalTrackingNo}
                onChange={(e) => update('externalTrackingNo', e.target.value)}
                placeholder={t('shipments.form.externalTrackingPlaceholder')}
                className={cn('h-12 rounded-xl bg-white px-4', fieldErrors.externalTrackingNo && 'border-red-300')}
              />
              {renderFieldError('externalTrackingNo')}
            </div>
          </div>

          <div className="field-stack mt-4">
            <Label htmlFor="item-description">{t('shipments.form.itemDescription')}</Label>
            <Textarea id="item-description" value={form.itemDescription} onChange={(e) => update('itemDescription', e.target.value)} rows={4} className="rounded-xl bg-white px-4 py-3" />
          </div>

          {error && (
            <div className="mt-4 rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--brand-danger)]">
              <div className="flex items-start gap-2">
                <Icon id="alert" size={16} className="mt-0.5" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </section>
      </form>

      <aside className="page-stack">
        <div className="surface-panel sticky-surface p-4 sm:p-5">
          <p className="metric-label">{t('shipments.form.previewTitle')}</p>
          <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground">
            {t('shipments.form.previewSubtitle')}
          </h2>

          <div className="mt-5 space-y-3">
            <div className="surface-muted p-4">
              <p className="data-label">{t('tracking.route')}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {originBranch?.branchName ?? t('common.none')} {'→'} {destinationBranch?.branchName ?? t('common.none')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {originBranch?.country ?? '-'} / {destinationBranch?.country ?? '-'}
              </p>
            </div>

            <div className="surface-muted p-4">
              <p className="data-label">{t('shipments.detail.shippingFee')}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {form.priceType === 'manual'
                  ? `${form.manualPrice || 0} ${originBranch?.currency ?? 'THB'}`
                  : t('shipments.form.autoPriceNote')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {form.priceType === 'manual' ? t('shipments.form.manualPrice') : t('shipments.form.autoPrice')}
              </p>
            </div>

            <div className="surface-muted p-4">
              <p className="data-label">{t('shipments.detail.cod')}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {Number(form.codAmount || 0) > 0 ? `${form.codAmount} ${originBranch?.currency ?? 'THB'}` : t('common.none')}
              </p>
            </div>

            <div className="surface-muted p-4">
              <p className="data-label">{t('shipments.form.shippingPartner')}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {form.shippingPartner ? t(`partners.${form.shippingPartner}`) : t('shipments.form.noPartner')}
              </p>
              {form.externalTrackingNo.trim() && (
                <p className="mt-1 text-sm text-muted-foreground">{form.externalTrackingNo.trim()}</p>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-[1rem] border border-border/80 bg-[var(--brand-soft)] px-4 py-3 text-sm text-muted-foreground">
            {t('shipments.form.previewHint')}
          </div>
        </div>

        <div className="surface-panel p-4 sm:p-5">
          <p className="metric-label">{t('shipments.form.submit')}</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{t('shipments.form.submitHint')}</p>
          <Button
            type="submit"
            form="shipment-create-form"
            disabled={loading}
            size="lg"
            className="mt-5 h-12 w-full rounded-xl"
          >
            {loading ? t('shipments.form.submitting') : t('shipments.form.submit')}
          </Button>
        </div>
      </aside>

      {/* UX-04: Sticky submit bar on mobile */}
      <div className="fixed bottom-0 inset-x-0 z-40 xl:hidden border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3 safe-bottom">
        <div className="flex items-center gap-3 max-w-screen-sm mx-auto">
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {originBranch?.branchName ?? '–'} → {destinationBranch?.branchName ?? '–'}
            </p>
            <p className="text-xs text-muted-foreground">
              {form.priceType === 'manual' ? `${form.manualPrice || 0} ${codCurrency}` : t('shipments.form.autoPrice')}
              {Number(form.codAmount || 0) > 0 ? ` · COD ${form.codAmount} ${codCurrency}` : ''}
            </p>
          </div>
          <Button
            type="submit"
            form="shipment-create-form"
            disabled={loading}
            size="lg"
            className="h-11 shrink-0 rounded-xl px-5"
          >
            {loading ? t('shipments.form.submitting') : t('shipments.form.submit')}
          </Button>
        </div>
      </div>
    </div>
  )
}
