import { useState, useRef, useMemo } from 'react'
import { Section, Segmented } from '@/components/ui'
import { cn } from '@/lib/utils'
import { Wifi, Download, Copy, Eye, EyeOff } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useToast } from '@/components/Toaster'

type Enc = 'WPA' | 'WEP' | 'nopass'

const ENC_OPTIONS: { value: Enc; label: string }[] = [
  { value: 'WPA', label: 'WPA/WPA2' },
  { value: 'WEP', label: 'WEP' },
  { value: 'nopass', label: 'None' },
]

function buildWifiString(ssid: string, password: string, enc: Enc): string {
  if (!ssid) return ''
  const escape = (s: string) => s.replace(/[\\;,:\"]/g, (c) => '\\' + c)
  const parts = [`T:${enc}`, `S:${escape(ssid)}`]
  if (enc !== 'nopass' && password) parts.push(`P:${escape(password)}`)
  return `WIFI:${parts.join(';')};;`
}

function svgToPng(svgRef: SVGSVGElement | null): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!svgRef) return reject('No SVG')
    const svgData = new XMLSerializer().serializeToString(svgRef)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData)
  })
}

export default function WifiQr() {
  const toast = useToast()
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')
  const [enc, setEnc] = useState<Enc>('WPA')
  const [showPw, setShowPw] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  const wifiStr = useMemo(() => buildWifiString(ssid, password, enc), [ssid, password, enc])
  const hasData = ssid.length > 0

  const downloadPng = async () => {
    if (!svgRef.current) return
    try {
      const dataUrl = await svgToPng(svgRef.current)
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'wifi-qr.png'
      a.click()
    } catch {
      toast.error('Download failed. Try again.')
    }
  }

  const copyString = () => {
    if (!wifiStr) return
    navigator.clipboard.writeText(wifiStr).then(
      () => toast.success('WiFi config copied.'),
      () => toast.error('Copy failed.'),
    )
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">WiFi QR Code</h2>
      <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">Generate a QR code for easy WiFi sharing.</p>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="grid gap-4">
          <div>
            <label className="label">Network Name (SSID)</label>
            <input
              type="text"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              className="input"
              placeholder="MyWiFiNetwork"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-10"
                placeholder="Enter password"
                disabled={enc === 'nopass'}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">Encryption</label>
            <Segmented value={enc} onChange={setEnc} options={ENC_OPTIONS} />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={downloadPng} disabled={!hasData} className="btn-primary btn-sm">
              <Download className="h-4 w-4" /> Download PNG
            </button>
            <button onClick={copyString} disabled={!hasData} className="btn-secondary btn-sm">
              <Copy className="h-4 w-4" /> Copy Config
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4">
          {hasData ? (
            <div className="rounded-xl bg-white p-4 shadow-card">
              <QRCodeSVG
                ref={svgRef}
                value={wifiStr}
                size={240}
                level="M"
                includeMargin={false}
              />
            </div>
          ) : (
            <div className="w-60 h-60 grid place-items-center rounded-xl border-2 border-dashed border-ink-300 dark:border-ink-700 text-ink-400">
              <Wifi className="h-12 w-12" />
            </div>
          )}
          <p className="text-xs text-ink-500 text-center max-w-xs font-mono break-all">
            {hasData ? wifiStr : 'Enter network details to generate a QR code'}
          </p>
        </div>
      </div>
    </Section>
  )
}
