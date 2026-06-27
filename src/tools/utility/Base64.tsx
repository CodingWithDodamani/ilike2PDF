import { useState } from 'react'
import { Copy, ArrowDownUp, Upload, Download } from 'lucide-react'
import { Segmented, Field } from '@/components/ui'
import { Dropzone } from '@/components/Dropzone'
import { useToast } from '@/components/Toaster'
import { downloadBlob, fileToDataUrl } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

export default function Base64() {
  const toast = useToast()
  const [tab, setTab] = useState<'text' | 'file'>('text')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const run = () => {
    try {
      if (mode === 'encode') setOutput(btoa(unescape(encodeURIComponent(input))))
      else setOutput(decodeURIComponent(escape(atob(input.trim()))))
      trackUsage({ toolId: 'base64', toolName: 'Base64', action: `${mode} text` })
    } catch { toast.error('Invalid input for decoding.') }
  }

  const onFile = async (files: File[]) => {
    try {
      const url = await fileToDataUrl(files[0])
      setOutput(url)
      trackUsage({ toolId: 'base64', toolName: 'Base64', action: 'Encoded file', fileName: files[0].name, inputSize: files[0].size })
      toast.success('File encoded to data URI.')
    } catch { toast.error('Failed to encode file.') }
  }

  return (
    <div className="grid gap-5">
      <Segmented value={tab} onChange={setTab} options={[{ value: 'text', label: 'Text' }, { value: 'file', label: 'File' }]} />
      {tab === 'text' ? (
        <div className="card p-5 grid gap-4">
          <Segmented value={mode} onChange={setMode} options={[{ value: 'encode', label: 'Encode' }, { value: 'decode', label: 'Decode' }]} />
          <Field label={mode === 'encode' ? 'Plain text' : 'Base64'}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} className="input font-mono text-sm h-32 resize-y" placeholder={mode === 'encode' ? 'Type text…' : 'Paste base64…'} />
          </Field>
          <button onClick={run} className="btn-primary btn-md w-fit"><ArrowDownUp className="h-4 w-4" /> {mode === 'encode' ? 'Encode' : 'Decode'}</button>
          {output && (
            <Field label="Result">
              <textarea readOnly value={output} className="input font-mono text-sm h-32 resize-y break-all" />
              <button onClick={() => { navigator.clipboard.writeText(output).then(() => toast.success('Copied.')).catch(() => toast.error('Copy failed.')) }} className="btn-secondary btn-sm mt-2"><Copy className="h-4 w-4" /> Copy</button>
            </Field>
          )}
        </div>
      ) : (
        <div className="card p-5 grid gap-4">
          <Dropzone accept={['*/*']} compact onFiles={onFile} label="Drop a file to encode" icon={<Upload className="h-6 w-6" />} />
          {output && (
            <Field label="Data URI">
              <textarea readOnly value={output} className="input font-mono text-sm h-32 resize-y break-all" />
              <div className="flex gap-2 mt-2">
                <button onClick={() => { navigator.clipboard.writeText(output).then(() => toast.success('Copied.')).catch(() => toast.error('Copy failed.')) }} className="btn-secondary btn-sm"><Copy className="h-4 w-4" /> Copy</button>
                <button onClick={() => downloadBlob(new Blob([output], { type: 'text/plain' }), 'base64.txt')} className="btn-ghost btn-sm"><Download className="h-4 w-4" /> Download</button>
              </div>
            </Field>
          )}
        </div>
      )}
    </div>
  )
}
