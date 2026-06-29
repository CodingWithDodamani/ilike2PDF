import { useState, useCallback } from 'react'
import { Upload, Copy, Check, Download, Loader2, Image } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'
import { createWorker } from 'tesseract.js'

type Lang = 'eng' | 'spa' | 'fra' | 'deu' | 'ita' | 'por' | 'rus' | 'jpn' | 'chi_sim' | 'kor' | 'ara'

const LANGUAGES: { code: Lang; name: string }[] = [
  { code: 'eng', name: 'English' },
  { code: 'spa', name: 'Spanish' },
  { code: 'fra', name: 'French' },
  { code: 'deu', name: 'German' },
  { code: 'ita', name: 'Italian' },
  { code: 'por', name: 'Portuguese' },
  { code: 'rus', name: 'Russian' },
  { code: 'jpn', name: 'Japanese' },
  { code: 'chi_sim', name: 'Chinese (Simplified)' },
  { code: 'kor', name: 'Korean' },
  { code: 'ara', name: 'Arabic' },
]

export default function ImageOcr() {
  const [image, setImage] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [lang, setLang] = useState<Lang>('eng')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [copied, setCopied] = useState(false)
  const [confidence, setConfidence] = useState<number | null>(null)

  const processImage = useCallback(async (file: File) => {
    setProcessing(true)
    setProgress(0)
    setText('')
    setConfidence(null)
    const url = URL.createObjectURL(file)
    setImage(url)

    try {
      const worker = await createWorker(lang, 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') setProgress(Math.round((m.progress || 0) * 100))
        },
      })
      const { data } = await worker.recognize(url)
      setText(data.text)
      setConfidence(data.confidence)
      await worker.terminate()
    } catch (e: any) {
      setText(`Error: ${e.message}`)
    }
    setProcessing(false)
  }, [lang])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'))
    if (file) processImage(file)
  }, [processImage])

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processImage(file)
    e.target.value = ''
  }, [processImage])

  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const download = () => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'ocr-text.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Image to Text (OCR)</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Extract text from images using Tesseract.js OCR. Supports 11 languages.
      </p>

      {/* Language */}
      <div className="mb-4">
        <label className="label">Language</label>
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => setLang(l.code)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition',
                lang === l.code ? 'bg-brand-500 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700')}>
              {l.name}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}
        className="border-2 border-dashed rounded-xl p-6 text-center border-ink-300 dark:border-ink-600 hover:border-brand-500 transition cursor-pointer mb-4">
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" id="ocr-input" />
        <label htmlFor="ocr-input" className="cursor-pointer">
          {processing ? (
            <Loader2 className="w-8 h-8 mx-auto mb-2 text-brand-500 animate-spin" />
          ) : (
            <Image className="w-8 h-8 mx-auto mb-2 text-ink-400" />
          )}
          <p className="text-sm">{processing ? `Processing... ${progress}%` : 'Drop an image or click to browse'}</p>
        </label>
      </div>

      {/* Progress */}
      {processing && (
        <div className="h-2 rounded-full bg-ink-200 dark:bg-ink-800 overflow-hidden mb-4">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all"
            style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Image + result */}
      {image && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="label mb-1">Source Image</p>
            <img src={image} alt="Source" className="w-full rounded-xl object-cover max-h-60" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="label mb-0">
                Extracted Text
                {confidence !== null && (
                  <span className="ml-2 text-xs text-ink-400">({confidence.toFixed(1)}% confidence)</span>
                )}
              </p>
              <div className="flex gap-1">
                <button onClick={copy} className="btn-ghost px-2 py-1 text-xs rounded-lg flex items-center gap-1">
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  Copy
                </button>
                {text && (
                  <button onClick={download} className="btn-ghost px-2 py-1 text-xs rounded-lg flex items-center gap-1">
                    <Download className="w-3 h-3" /> Save
                  </button>
                )}
              </div>
            </div>
            <textarea className="input w-full h-60 font-mono text-sm resize-y" value={text}
              onChange={e => setText(e.target.value)} placeholder="Extracted text will appear here..." />
          </div>
        </div>
      )}
    </Section>
  )
}
