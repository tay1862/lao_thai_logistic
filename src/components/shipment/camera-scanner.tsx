'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { useI18n } from '@/lib/i18n'

interface CameraScannerProps {
  onScan: (value: string) => void
  onClose: () => void
}

export function CameraScanner({ onScan, onClose }: CameraScannerProps) {
  const { t } = useI18n()
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')

  const stopScanning = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null
    // Also stop any lingering media tracks
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((t) => t.stop())
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }, [])

  useEffect(() => {
    BrowserMultiFormatReader.listVideoInputDevices()
      .then((devices) => {
        setCameras(devices)
        const back = devices.find((d) => /back|rear|environment/i.test(d.label))
        setSelectedCamera(back?.deviceId ?? devices[0]?.deviceId ?? '')
      })
      .catch(() => setError(t('scan.cameraError')))

    return () => stopScanning()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startScanning = useCallback(async () => {
    if (!videoRef.current) return
    setError('')
    setScanning(true)

    const reader = new BrowserMultiFormatReader()

    try {
      const controls = await reader.decodeFromVideoDevice(
        selectedCamera || undefined,
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText()
            stopScanning()
            onScan(text)
          }
          if (err) {
            // DecodeHintType errors fire every frame with no code found — only handle real errors
            const msg = err.message ?? ''
            if (msg && !msg.includes('No MultiFormat Readers') && !msg.includes('not found')) {
              setError(t('scan.cameraError'))
              stopScanning()
            }
          }
        }
      )
      controlsRef.current = controls
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('scan.cameraError')
      setError(msg.toLowerCase().includes('permission') ? t('scan.cameraPermission') : t('scan.cameraError'))
      setScanning(false)
    }
  }, [selectedCamera, stopScanning, onScan, t])

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          aria-label={t('scan.cameraTitle')}
        />

        {scanning && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-48 rounded-lg border-4 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
          </div>
        )}

        {!scanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-white">
            <Icon id="scan" size={40} className="opacity-60" />
            <p className="text-sm text-white/70">{t('scan.cameraHint')}</p>
          </div>
        )}
      </div>

      {cameras.length > 1 && (
        <div className="field-stack">
          <select
            className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            value={selectedCamera}
            onChange={(e) => {
              if (scanning) stopScanning()
              setSelectedCamera(e.target.value)
            }}
          >
            {cameras.map((cam) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `Camera ${cam.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--brand-danger)]">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        {!scanning ? (
          <Button onClick={startScanning} size="lg" className="h-12 flex-1 rounded-xl">
            <Icon id="scan" size={16} className="mr-2" />
            {t('scan.cameraStart')}
          </Button>
        ) : (
          <Button onClick={stopScanning} variant="outline" size="lg" className="h-12 flex-1 rounded-xl">
            {t('scan.cameraStop')}
          </Button>
        )}
        <Button onClick={onClose} variant="outline" size="lg" className="h-12 rounded-xl px-5">
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  )
}
