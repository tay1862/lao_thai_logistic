'use client'

import { useState, lazy, Suspense, useCallback, useRef } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/ui/status-badge'
import { Icon } from '@/components/ui/icon'
import { useI18n } from '@/lib/i18n'
import { ALLOWED_TRANSITIONS } from '@/lib/shipment-status'
import { cn } from '@/lib/utils'
import type { ShipmentStatus } from '@/types'

// Lazy-load camera scanner so ZXing bundle is not loaded unless needed
const CameraScanner = lazy(() =>
  import('@/components/shipment/camera-scanner').then((m) => ({ default: m.CameraScanner }))
)

type LookupShipment = {
  id: string
  trackingNo: string
  status: ShipmentStatus
  codAmount: number
  currency: 'THB' | 'LAK'
  destinationBranch: { branchName: string }
  receiver: { firstname: string; lastname: string; phone: string }
}

type BatchItem = {
  id: string
  trackingNo: string
  currentStatus: ShipmentStatus
  newStatus: ShipmentStatus
  receiver: string
}

type BatchPhase = 'idle' | 'setup' | 'scanning' | 'preview' | 'done'

export default function ScanPage() {
  const { t } = useI18n()

  // Single scan mode
  const [trackingNo, setTrackingNo] = useState('')
  const [shipment, setShipment] = useState<LookupShipment | null>(null)
  const [lastSaved, setLastSaved] = useState<{ trackingNo: string; id: string } | null>(null)
  const [status, setStatus] = useState<ShipmentStatus | ''>('')
  const [location, setLocation] = useState('')
  const [note, setNote] = useState('')
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCamera, setShowCamera] = useState(false)

  // Batch mode
  const [batchMode, setBatchMode] = useState(false)
  const [batchPhase, setBatchPhase] = useState<BatchPhase>('idle')
  const [batchTargetStatus, setBatchTargetStatus] = useState<ShipmentStatus>('in_transit')
  const [batchLocation, setBatchLocation] = useState('')
  const [batchNote, setBatchNote] = useState('')
  const [batchInput, setBatchInput] = useState('')
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  const [batchError, setBatchError] = useState('')
  const [batchScanning, setBatchScanning] = useState(false)
  const [batchSubmitting, setBatchSubmitting] = useState(false)
  const [batchResult, setBatchResult] = useState<{ success: number; failed: { trackingNo: string; reason: string }[] } | null>(null)
  const batchInputRef = useRef<HTMLInputElement>(null)

  const nextStatuses = shipment ? ALLOWED_TRANSITIONS[shipment.status] : []
  const isTerminal = shipment ? ALLOWED_TRANSITIONS[shipment.status].length === 0 : false

  // ——— Single scan helpers ———

  function handleCameraScan(scanned: string) {
    setTrackingNo(scanned)
    setShowCamera(false)
    setTimeout(() => doSearch(scanned), 50)
  }

  async function doSearch(no: string) {
    const q = no.trim()
    if (!q) return
    setSearching(true)
    setError('')
    setShipment(null)
    setStatus('')
    setLastSaved(null)
    try {
      const res = await fetch(`/api/v1/shipments/lookup?trackingNo=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok || !data.success || !data.data) {
        const message = data.error ?? t('shipments.notFound')
        setError(message)
        toast.error(message)
        return
      }
      const found = data.data as LookupShipment
      setShipment(found)
      setStatus(ALLOWED_TRANSITIONS[found.status][0] ?? '')
      setLocation(found.destinationBranch.branchName)
      toast.success(t('scan.found'))
    } catch {
      setError(t('common.serverError'))
      toast.error(t('common.serverError'))
    } finally {
      setSearching(false)
    }
  }

  async function updateStatus(e: React.FormEvent) {
    e.preventDefault()
    if (!shipment || !status) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/shipments/${shipment.id}`, {
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
      // UX-02: Stay on page — reset form and show success with link
      const saved = { trackingNo: shipment.trackingNo, id: shipment.id }
      setLastSaved(saved)
      setShipment(null)
      setTrackingNo('')
      setStatus('')
      setLocation('')
      setNote('')
      toast.success(`${t('scan.saveSuccess')} — ${saved.trackingNo}`)
    } catch {
      setError(t('common.serverError'))
      toast.error(t('common.serverError'))
    } finally {
      setSaving(false)
    }
  }

  // ——— Batch scan helpers ———

  const BATCH_STATUS_OPTIONS: ShipmentStatus[] = ['in_transit', 'arrived', 'delivered', 'failed_delivery', 'returned']

  async function handleBatchScan(no: string) {
    const q = no.trim()
    if (!q || batchScanning) return
    if (batchItems.some((item) => item.trackingNo === q)) {
      setBatchError(t('scan.batchDuplicate'))
      return
    }
    setBatchScanning(true)
    setBatchError('')
    try {
      const res = await fetch(`/api/v1/shipments/lookup?trackingNo=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok || !data.success || !data.data) {
        setBatchError(data.error ?? t('shipments.notFound'))
        return
      }
      const found = data.data as LookupShipment
      if (!ALLOWED_TRANSITIONS[found.status].includes(batchTargetStatus)) {
        setBatchError(`${q}: ${t('scan.batchInvalidTransition')} (${found.status} → ${batchTargetStatus})`)
        return
      }
      setBatchItems((prev) => [
        ...prev,
        {
          id: found.id,
          trackingNo: found.trackingNo,
          currentStatus: found.status,
          newStatus: batchTargetStatus,
          receiver: `${found.receiver.firstname} ${found.receiver.lastname}`,
        },
      ])
      setBatchInput('')
      batchInputRef.current?.focus()
    } catch {
      setBatchError(t('common.serverError'))
    } finally {
      setBatchScanning(false)
    }
  }

  async function confirmBatch() {
    if (batchItems.length === 0) return
    setBatchSubmitting(true)
    try {
      const res = await fetch('/api/v1/shipments/batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: batchItems.map((item) => item.id),
          status: batchTargetStatus,
          location: batchLocation || undefined,
          note: batchNote || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error ?? t('common.serverError'))
        return
      }
      setBatchResult(data.data)
      setBatchPhase('done')
    } catch {
      toast.error(t('common.serverError'))
    } finally {
      setBatchSubmitting(false)
    }
  }

  function resetBatch() {
    setBatchPhase('idle')
    setBatchItems([])
    setBatchInput('')
    setBatchError('')
    setBatchResult(null)
  }

  function startBatchMode() {
    setBatchMode(true)
    setBatchPhase('setup')
    resetBatch()
  }

  function exitBatchMode() {
    setBatchMode(false)
    setBatchPhase('idle')
    resetBatch()
  }

  const handleBatchInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleBatchScan(batchInput)
    }
  }, [batchInput, handleBatchScan]) // eslint-disable-line

  return (
    <div className="page-stack">
      <section className="page-header">
        <div className="space-y-3">
          <span className="eyebrow">
            <Icon id="scan" size={14} />
            {t('scan.title')}
          </span>
          <div>
            <h1 className="page-title">{t('scan.title')}</h1>
            <p className="page-subtitle">{t('scan.subtitle')}</p>
          </div>
        </div>
        {/* Batch mode toggle */}
        <Button
          variant={batchMode ? 'default' : 'outline'}
          size="sm"
          onClick={batchMode ? exitBatchMode : startBatchMode}
          className="h-10 rounded-full px-4"
          data-testid="batch-mode-toggle"
        >
          <Icon id="clipboard" size={16} className="mr-2" />
          {batchMode ? t('scan.exitBatch') : t('scan.batchMode')}
        </Button>
      </section>

      {/* ——— BATCH MODE ——— */}
      {batchMode && (
        <div className="page-stack" data-testid="batch-panel">
          {/* Setup */}
          {batchPhase === 'setup' && (
            <Card className="surface-panel border-0 py-0 shadow-none">
              <CardContent className="px-4 py-5 sm:px-5">
                <p className="metric-label">{t('scan.batchSetup')}</p>
                <div className="mt-5 space-y-4">
                  <div className="field-stack">
                    <Label htmlFor="batch-target-status">{t('scan.batchTargetStatus')}</Label>
                    <div className="flex flex-wrap gap-2" role="group" aria-label={t('scan.batchTargetStatus')}>
                      {BATCH_STATUS_OPTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setBatchTargetStatus(s)}
                          className={cn(
                            'inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors',
                            batchTargetStatus === s
                              ? 'border-transparent bg-[var(--brand-primary)] text-white'
                              : 'border-border/80 bg-white text-muted-foreground hover:bg-muted'
                          )}
                        >
                          {t(`status.${s}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="field-stack">
                    <Label htmlFor="batch-location">{t('scan.location')}</Label>
                    <Input id="batch-location" value={batchLocation} onChange={(e) => setBatchLocation(e.target.value)} className="h-12 rounded-xl bg-white px-4" />
                  </div>
                  <div className="field-stack">
                    <Label htmlFor="batch-note">{t('scan.note')}</Label>
                    <Input id="batch-note" value={batchNote} onChange={(e) => setBatchNote(e.target.value)} className="h-12 rounded-xl bg-white px-4" />
                  </div>
                  <Button size="lg" className="h-12 rounded-xl" onClick={() => { resetBatch(); setBatchPhase('scanning') }} data-testid="batch-start">
                    {t('scan.batchStart')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scanning */}
          {batchPhase === 'scanning' && (
            <Card className="surface-panel border-0 py-0 shadow-none">
              <CardContent className="px-4 py-5 sm:px-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="metric-label">{t('scan.batchScanning')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('scan.batchTargetStatus')}: <strong>{t(`status.${batchTargetStatus}`)}</strong>
                    </p>
                  </div>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-primary)] font-bold text-lg">
                    {batchItems.length}
                  </span>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-[var(--brand-border)] bg-[linear-gradient(180deg,rgba(238,244,255,0.88),rgba(255,255,255,0.94))] p-4">
                  <div className="flex gap-3">
                    <Input
                      ref={batchInputRef}
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      onKeyDown={handleBatchInputKeyDown}
                      placeholder={t('scan.trackingPlaceholder')}
                      disabled={batchScanning}
                      className="h-14 rounded-[1rem] border-white bg-white px-4 text-base"
                      data-testid="batch-scan-input"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="lg"
                      onClick={() => handleBatchScan(batchInput)}
                      disabled={batchScanning || !batchInput.trim()}
                      className="h-14 rounded-[1rem] px-5"
                    >
                      {batchScanning ? t('common.loading') : t('common.search')}
                    </Button>
                  </div>
                  {batchError && (
                    <div className="mt-3 rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--brand-danger)]" data-testid="batch-error">
                      {batchError}
                      <button className="ml-3 underline" onClick={() => setBatchError('')}>{t('common.cancel')}</button>
                    </div>
                  )}
                </div>

                {batchItems.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {batchItems.slice(-3).map((item) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm">
                        <Icon id="check-circle" size={16} className="text-emerald-600 shrink-0" />
                        <span className="mono-tracking text-foreground">{item.trackingNo}</span>
                        <span className="text-muted-foreground">{item.receiver}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex gap-3">
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => setBatchPhase('setup')}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full"
                    disabled={batchItems.length === 0}
                    onClick={() => setBatchPhase('preview')}
                    data-testid="batch-review"
                  >
                    {t('scan.batchReview')} ({batchItems.length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {batchPhase === 'preview' && (
            <Card className="surface-panel border-0 py-0 shadow-none">
              <CardContent className="px-4 py-5 sm:px-5">
                <p className="metric-label">{t('scan.batchPreview')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('scan.batchPreviewHint')}</p>
                <div className="mt-4 overflow-x-auto rounded-xl border border-border/80" data-testid="batch-preview-table">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/40">
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">{t('tracking.title')}</th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">{t('shipments.detail.receiver')}</th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">{t('scan.batchCurrentStatus')}</th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">{t('scan.batchNewStatus')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchItems.map((item) => (
                        <tr key={item.id} className="border-b border-border/40 last:border-0">
                          <td className="mono-tracking px-4 py-3">{item.trackingNo}</td>
                          <td className="px-4 py-3 text-muted-foreground">{item.receiver}</td>
                          <td className="px-4 py-3"><StatusBadge status={item.currentStatus} /></td>
                          <td className="px-4 py-3"><StatusBadge status={item.newStatus} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => setBatchPhase('scanning')}>
                    {t('scan.batchEdit')}
                  </Button>
                  <Button
                    size="lg"
                    className="h-12 flex-1 rounded-xl"
                    disabled={batchSubmitting}
                    onClick={confirmBatch}
                    data-testid="batch-confirm"
                  >
                    {batchSubmitting ? t('common.loading') : `${t('scan.batchConfirm')} ${batchItems.length} ${t('shipments.count')}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Done */}
          {batchPhase === 'done' && batchResult && (
            <Card className="surface-panel border-0 py-0 shadow-none">
              <CardContent className="px-4 py-5 sm:px-5">
                <p className="metric-label">{t('scan.batchDone')}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-4">
                    <Icon id="check-circle" size={24} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-2xl font-bold text-emerald-700">{batchResult.success}</p>
                      <p className="text-sm text-emerald-600">{t('scan.batchSuccess')}</p>
                    </div>
                  </div>
                  {batchResult.failed.length > 0 && (
                    <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-4">
                      <Icon id="alert" size={24} className="text-red-600 shrink-0" />
                      <div>
                        <p className="text-2xl font-bold text-red-700">{batchResult.failed.length}</p>
                        <p className="text-sm text-red-600">{t('scan.batchFailed')}</p>
                      </div>
                    </div>
                  )}
                </div>
                {batchResult.failed.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {batchResult.failed.map((f) => (
                      <div key={f.trackingNo} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                        {f.trackingNo}: {f.reason}
                      </div>
                    ))}
                  </div>
                )}
                <Button size="lg" className="mt-4 h-12 w-full rounded-xl" onClick={() => { resetBatch(); setBatchPhase('setup') }}>
                  {t('scan.batchAgain')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ——— SINGLE SCAN MODE ——— */}
      {!batchMode && (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)]">
          <div className="page-stack">
            <Card className="surface-panel border-0 py-0 shadow-none">
              <CardContent className="px-4 py-5 sm:px-5">
                <p className="metric-label">{t('scan.searchTitle')}</p>
                <div className="mt-4 rounded-[1.5rem] border border-[var(--brand-border)] bg-[linear-gradient(180deg,rgba(238,244,255,0.88),rgba(255,255,255,0.94))] p-4 sm:p-5">
                  <form onSubmit={(e) => { e.preventDefault(); doSearch(trackingNo) }} className="space-y-4">
                    <Label htmlFor="tracking-lookup" className="sr-only">
                      {t('scan.trackingPlaceholder')}
                    </Label>
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                      <div className="relative">
                        <Icon id="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="tracking-lookup"
                          value={trackingNo}
                          onChange={(e) => setTrackingNo(e.target.value)}
                          placeholder={t('scan.trackingPlaceholder')}
                          className="h-14 rounded-[1rem] border-white bg-white pl-12 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                        />
                      </div>
                      {/* UX-06: Camera button with text on mobile */}
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => setShowCamera((v) => !v)}
                        className="h-14 rounded-[1rem] gap-2 px-4"
                        aria-label={t('scan.cameraTitle')}
                        data-testid="camera-toggle"
                      >
                        <Icon id="camera" size={20} />
                        <span className="sm:hidden text-sm font-medium">{t('scan.cameraScan')}</span>
                      </Button>
                      <Button type="submit" size="lg" disabled={searching} className="h-14 rounded-[1rem] px-6">
                        {searching ? t('common.loading') : t('common.search')}
                      </Button>
                    </div>

                    {showCamera && (
                      <Suspense fallback={<div className="py-6 text-center text-sm text-muted-foreground">{t('common.loading')}</div>}>
                        <CameraScanner onScan={handleCameraScan} onClose={() => setShowCamera(false)} />
                      </Suspense>
                    )}

                    <p className="text-sm text-muted-foreground">{t('scan.lookupHint')}</p>

                    {error && !shipment && (
                      <div className="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--brand-danger)]">
                        {error}
                      </div>
                    )}
                  </form>
                </div>

                {/* UX-02: Last saved toast link */}
                {lastSaved && !shipment && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <Icon id="check-circle" size={16} className="shrink-0" />
                    <span>{t('scan.saveSuccess')} — <span className="mono-tracking">{lastSaved.trackingNo}</span></span>
                    <Link href={`/dashboard/shipments/${lastSaved.id}`} className="ml-auto shrink-0 underline font-medium">
                      {t('scan.viewDetail')} →
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="surface-panel border-0 py-0 shadow-none">
              <CardContent className="px-4 py-5 sm:px-5">
                <div className="page-header gap-4">
                  <div>
                    <p className="metric-label">{t('scan.updateTitle')}</p>
                    <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-foreground">
                      {shipment ? t('scan.found') : t('scan.searchTitle')}
                    </h2>
                  </div>
                  {shipment && (
                    <Link
                      href={`/dashboard/shipments/${shipment.id}`}
                      className="touch-target inline-flex items-center gap-2 rounded-full border border-border/80 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {t('common.viewAll')}
                      <Icon id="chevron-right" size={14} />
                    </Link>
                  )}
                </div>

                {!shipment ? (
                  <div className="surface-muted mt-5 px-4 py-10 text-center text-sm text-muted-foreground">
                    {t('scan.lookupHint')}
                  </div>
                ) : (
                  <div className="mt-5 space-y-5">
                    <div className="surface-muted p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="mono-tracking text-foreground">{shipment.trackingNo}</span>
                        <StatusBadge status={shipment.status} />
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="data-label">{t('shipments.detail.receiver')}</p>
                          <p className="mt-1 data-value">{shipment.receiver.firstname} {shipment.receiver.lastname}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{shipment.receiver.phone}</p>
                        </div>
                        <div>
                          <p className="data-label">{t('shipments.detail.destination')}</p>
                          <p className="mt-1 data-value">{shipment.destinationBranch.branchName}</p>
                          {shipment.codAmount > 0 && (
                            <p className="mt-1 text-sm text-amber-700">COD {shipment.codAmount.toLocaleString()} {shipment.currency}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* UX-12: Terminal status message */}
                    {isTerminal ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800" data-testid="terminal-status-message">
                        <div className="flex items-start gap-3">
                          <Icon id="alert" size={16} className="mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold">{t('scan.terminalTitle')}</p>
                            <p className="mt-1">{t('scan.terminalBody').replace('{status}', t(`status.${shipment.status}`))}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={updateStatus} className="space-y-4">
                        <div className="field-stack">
                          <Label>{t('scan.newStatus')}</Label>
                          {/* UX-11: Pill buttons on mobile */}
                          <div className="flex flex-wrap gap-2 sm:hidden" role="group" aria-label={t('scan.newStatus')} data-testid="status-pills">
                            {nextStatuses.map((option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => setStatus(option)}
                                className={cn(
                                  'inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors',
                                  status === option
                                    ? 'border-transparent bg-[var(--brand-primary)] text-white'
                                    : 'border-border/80 bg-white text-muted-foreground hover:bg-muted'
                                )}
                              >
                                {t(`status.${option}`)}
                              </button>
                            ))}
                          </div>
                          <select
                            id="scan-status"
                            className="hidden h-12 w-full rounded-xl border border-input bg-white px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:block"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
                          >
                            {nextStatuses.map((option) => (
                              <option key={option} value={option}>{t(`status.${option}`)}</option>
                            ))}
                          </select>
                        </div>

                        <div className="field-stack">
                          <Label htmlFor="scan-location">{t('scan.location')}</Label>
                          <Input id="scan-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('scan.location')} className="h-12 rounded-xl bg-white px-4" />
                        </div>

                        <div className="field-stack">
                          <Label htmlFor="scan-note">{t('scan.note')}</Label>
                          <Textarea id="scan-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('scan.note')} className="rounded-xl bg-white px-4 py-3" />
                        </div>

                        {error && (
                          <div className="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--brand-danger)]">{error}</div>
                        )}

                        <Button type="submit" size="lg" disabled={saving} className="h-12 w-full rounded-xl" data-testid="scan-save-btn">
                          {saving ? t('scan.saving') : t('scan.save')}
                        </Button>
                      </form>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="page-stack">
            <Card className="surface-panel border-0 py-0 shadow-none">
              <CardContent className="px-4 py-5">
                <p className="metric-label">{t('dashboard.quickActions')}</p>
                <div className="mt-4 space-y-3">
                  <Link href="/dashboard/shipments" className="action-tile">
                    <span className="action-tile-icon"><Icon id="package" size={18} /></span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t('shipments.title')}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{t('shipments.workspaceSubtitle')}</p>
                    </div>
                  </Link>
                  <Link href="/dashboard/cod" className="action-tile">
                    <span className="action-tile-icon"><Icon id="banknote" size={18} /></span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t('cod.title')}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{t('cod.subtitle')}</p>
                    </div>
                  </Link>
                  <Link href="/dashboard/shipments/new" className="action-tile">
                    <span className="action-tile-icon"><Icon id="plus" size={18} /></span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t('shipments.new')}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{t('shipments.newSubtitle')}</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </aside>
        </section>
      )}
    </div>
  )
}
