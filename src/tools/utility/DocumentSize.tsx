import { useState } from 'react'
import { FileSearch } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Stat } from '@/components/ui'
import { formatBytes, fileToImage } from '@/lib/utils'
import { inspectPdf } from '@/lib/pdf'
import { fileToArrayBuffer } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

interface Info { name: string; size: number; type: string; extra: Record<string, string> }

export default function DocumentSize() {
  const [info, setInfo] = useState<Info | null>(null)

  const onFile = async (files: File[]) => {
    const f = files[0]
    const extra: Record<string, string> = { 'Last modified': new Date(f.lastModified).toLocaleString() }
    if (f.type.startsWith('image/')) {
      try { const img = await fileToImage(f); extra['Dimensions'] = `${img.naturalWidth} × ${img.naturalHeight} px`; extra['Megapixels'] = `${((img.naturalWidth * img.naturalHeight) / 1e6).toFixed(1)} MP` } catch { /* */ }
    } else if (f.type === 'application/pdf') {
      try { const pdf = await inspectPdf(await fileToArrayBuffer(f)); extra['Pages'] = pdf.encrypted ? 'Encrypted' : String(pdf.pageCount); if (pdf.title) extra['Title'] = pdf.title } catch { /* */ }
    }
    setInfo({ name: f.name, size: f.size, type: f.type || 'unknown', extra })
    trackUsage({ toolId: 'document-size', toolName: 'Document Checker', action: 'Inspected file', fileName: f.name, inputSize: f.size })
  }

  return (
    <div className="grid gap-5">
      <Dropzone accept={['*/*']} onFiles={onFile} label="Drop any file to inspect" hint="Images, PDFs, documents — anything" icon={<FileSearch className="h-8 w-8" />} />
      {info && (
        <div className="grid gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat label="Size" value={formatBytes(info.size)} sub={`${info.size.toLocaleString()} bytes`} />
            <Stat label="Type" value={<span className="text-base">{info.type}</span>} />
            {Object.entries(info.extra).map(([k, v]) => <Stat key={k} label={k} value={<span className="text-base">{v}</span>} />)}
          </div>
          <div className="card p-4 text-sm"><span className="text-ink-500">File name:</span> <span className="font-mono break-all">{info.name}</span></div>
        </div>
      )}
    </div>
  )
}
