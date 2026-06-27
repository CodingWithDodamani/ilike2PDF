import { useState } from 'react'
import { Binary, Copy, Download } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Segmented } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { baseName, downloadBlob, fileToDataUrl, formatBytes } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

export default function ImageToBase64() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [dataUrl, setDataUrl] = useState('')
  const [format, setFormat] = useState<'datauri' | 'css' | 'html' | 'raw'>('datauri')

  const onFile = async (files: File[]) => {
    const f = files[0]
    const url = await fileToDataUrl(f)
    setFile(f); setDataUrl(url)
    trackUsage({ toolId: 'image-to-base64', toolName: 'Image to Base64', action: 'Encoded image', fileName: f.name, inputSize: f.size })
  }

  const output = () => {
    if (format === 'raw') return dataUrl.split(',')[1] ?? ''
    if (format === 'css') return `background-image: url('${dataUrl}');`
    if (format === 'html') return `<img src="${dataUrl}" alt="" />`
    return dataUrl
  }

  if (!file) return <Dropzone accept={['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']} onFiles={onFile} label="Drop an image to encode" icon={<Binary className="h-8 w-8" />} />

  const out = output()
  return (
    <div className="card p-5 grid gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium">{file.name} · {formatBytes(file.size)} → {formatBytes(out.length)} encoded</p>
        <button onClick={() => setFile(null)} className="btn-ghost btn-sm">Change image</button>
      </div>
      <img src={dataUrl} alt="Preview" className="max-h-44 object-contain rounded-lg border border-ink-200 dark:border-ink-700 mx-auto" />
      <Segmented value={format} onChange={setFormat} options={[{ value: 'datauri', label: 'Data URI' }, { value: 'css', label: 'CSS' }, { value: 'html', label: 'HTML' }, { value: 'raw', label: 'Raw' }]} />
      <textarea readOnly value={out} className="input font-mono text-xs h-44 resize-y break-all" aria-label="Base64 output" />
      <div className="flex gap-2">
        <button onClick={() => { navigator.clipboard.writeText(out); toast.success('Copied.') }} className="btn-primary btn-sm"><Copy className="h-4 w-4" /> Copy</button>
        <button onClick={() => downloadBlob(new Blob([out], { type: 'text/plain' }), `${baseName(file.name)}-base64.txt`)} className="btn-secondary btn-sm"><Download className="h-4 w-4" /> Download .txt</button>
      </div>
    </div>
  )
}
