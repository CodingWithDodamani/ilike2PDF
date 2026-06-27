import { useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { LockOpen, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { loadPdfDocument, renderPageToCanvas } from '@/lib/pdf'
import { baseName, canvasToBlob, downloadBlob, bytesToBlob, fileToArrayBuffer } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

export default function UnlockPdf() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<ArrayBuffer | null>(null)
  const [encrypted, setEncrypted] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const onFile = async (files: File[]) => {
    const f = files[0]
    const buf = await fileToArrayBuffer(f)
    setFile(f); setData(buf); setPassword('')
    try {
      await loadPdfDocument(buf.slice(0))
      setEncrypted(false)
      toast.info('This PDF is not password-protected — you can re-save a clean copy.')
    } catch (e: any) {
      setEncrypted(e?.name === 'PasswordException')
    }
  }

  const run = async () => {
    if (!file || !data) return
    if (encrypted && !password) { toast.error('Enter the PDF password.'); return }
    setBusy(true)
    try {
      // Decrypt + render via pdf.js, then rebuild an unprotected PDF.
      const doc = await loadPdfDocument(data.slice(0), encrypted ? password : undefined)
      const out = await PDFDocument.create()
      for (let i = 1; i <= doc.numPages; i++) {
        const canvas = await renderPageToCanvas(doc, i, 2)
        const jpg = await canvasToBlob(canvas, 'image/jpeg', 0.92)
        const img = await out.embedJpg(await jpg.arrayBuffer())
        const page = await doc.getPage(i)
        const vp = page.getViewport({ scale: 1 })
        const p = out.addPage([vp.width, vp.height])
        p.drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height })
      }
      const bytes = await out.save()
      downloadBlob(bytesToBlob(bytes, 'application/pdf'), `${baseName(file.name)}-unlocked.pdf`)
      trackUsage({ toolId: 'unlock-pdf', toolName: 'Unlock PDF', action: 'Removed protection', fileName: file.name, inputSize: file.size })
      toast.success('Unlocked PDF created.')
    } catch (e: any) {
      toast.error(e?.name === 'PasswordException' ? 'Incorrect password.' : 'Unlock failed.')
    } finally { setBusy(false) }
  }

  if (!file || !data) {
    return (
      <div className="grid gap-3">
        <Dropzone accept={['application/pdf']} onFiles={onFile} label="Drop a protected PDF" icon={<LockOpen className="h-8 w-8" />} />
        <p className="text-xs text-ink-500">You need to know the password. Pages are re-rendered into a new, unprotected PDF (text becomes flattened).</p>
      </div>
    )
  }

  return (
    <div className="card p-5 grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{file.name} · {encrypted ? '🔒 Encrypted' : '🔓 Not encrypted'}</p>
        <button onClick={() => { setFile(null); setData(null) }} className="btn-ghost btn-sm">Change file</button>
      </div>
      {encrypted && (
        <Field label="Password"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Enter PDF password" /></Field>
      )}
      <button onClick={run} disabled={busy} className="btn-primary btn-md w-fit">{busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Unlock & download</button>
    </div>
  )
}
