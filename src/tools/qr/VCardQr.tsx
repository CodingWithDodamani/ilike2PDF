import { useState, useRef, useMemo } from 'react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'
import { User, Download, Copy } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useToast } from '@/components/Toaster'

type Form = {
  firstName: string
  lastName: string
  phone: string
  email: string
  org: string
  title: string
  website: string
  address: string
}

const EMPTY: Form = { firstName: '', lastName: '', phone: '', email: '', org: '', title: '', website: '', address: '' }

function buildVCard(f: Form): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${f.lastName};${f.firstName}`,
    `FN:${f.firstName} ${f.lastName}`.trim(),
  ]
  if (f.phone) lines.push(`TEL;TYPE=CELL:${f.phone}`)
  if (f.email) lines.push(`EMAIL:${f.email}`)
  if (f.org) lines.push(`ORG:${f.org}`)
  if (f.title) lines.push(`TITLE:${f.title}`)
  if (f.website) lines.push(`URL:${f.website}`)
  if (f.address) lines.push(`ADR:;;${f.address}`)
  lines.push('END:VCARD')
  return lines.join('\r\n')
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

export default function VCardQr() {
  const toast = useToast()
  const [form, setForm] = useState<Form>(EMPTY)
  const svgRef = useRef<SVGSVGElement>(null)

  const vcard = useMemo(() => buildVCard(form), [form])
  const hasData = form.firstName || form.lastName || form.phone || form.email || form.org || form.title || form.website || form.address

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [key]: e.target.value }))

  const downloadPng = async () => {
    if (!svgRef.current) return
    try {
      const dataUrl = await svgToPng(svgRef.current)
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'vcard-qr.png'
      a.click()
    } catch {
      toast.error('Download failed. Try again.')
    }
  }

  const copyVCard = () => {
    navigator.clipboard.writeText(vcard).then(
      () => toast.success('vCard copied.'),
      () => toast.error('Copy failed.'),
    )
  }

  const fields: { key: keyof Form; label: string }[] = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'org', label: 'Organization' },
    { key: 'title', label: 'Job Title' },
    { key: 'website', label: 'Website' },
    { key: 'address', label: 'Address' },
  ]

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">vCard QR Code</h2>
      <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">Create a contact card QR code.</p>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="label">{f.label}</label>
                <input
                  type="text"
                  value={form[f.key]}
                  onChange={set(f.key)}
                  className="input"
                  placeholder={f.label}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={downloadPng} disabled={!hasData} className="btn-primary btn-sm">
              <Download className="h-4 w-4" /> Download PNG
            </button>
            <button onClick={copyVCard} disabled={!hasData} className="btn-secondary btn-sm">
              <Copy className="h-4 w-4" /> Copy vCard
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4">
          {hasData ? (
            <div className="rounded-xl bg-white p-4 shadow-card">
              <QRCodeSVG
                ref={svgRef}
                value={vcard}
                size={240}
                level="M"
                includeMargin={false}
              />
            </div>
          ) : (
            <div className="w-60 h-60 grid place-items-center rounded-xl border-2 border-dashed border-ink-300 dark:border-ink-700 text-ink-400">
              <User className="h-12 w-12" />
            </div>
          )}
          <p className="text-xs text-ink-500 text-center max-w-xs font-mono break-all">
            {hasData ? vcard : 'Fill in details to generate a QR code'}
          </p>
        </div>
      </div>
    </Section>
  )
}
