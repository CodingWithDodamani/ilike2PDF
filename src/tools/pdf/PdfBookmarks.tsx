import { useState } from 'react'
import { PDFDocument, PDFDict, PDFName, PDFString, PDFNumber, PDFArray, PDFRef } from 'pdf-lib'
import { BookmarkPlus, Trash2, Download, Plus, ChevronUp, ChevronDown, Pencil } from 'lucide-react'
import { Dropzone } from '@/components/Dropzone'
import { Spinner, Field } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { usePdfFile } from '@/hooks/usePdfFile'
import { baseName, downloadBlob, bytesToBlob, cn } from '@/lib/utils'
import { trackUsage } from '@/lib/storage'

interface Bookmark { id: string; title: string; page: number; level: number }

let nextId = 1
const uid = () => String(nextId++)

export default function PdfBookmarks() {
  const toast = useToast()
  const pdf = usePdfFile()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newPage, setNewPage] = useState(1)
  const [newLevel, setNewLevel] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [busy, setBusy] = useState(false)

  const addBookmark = () => {
    if (!newTitle.trim()) { toast.error('Enter a bookmark title.'); return }
    if (newPage < 1 || newPage > pdf.count) { toast.error(`Page must be between 1 and ${pdf.count}.`); return }
    setBookmarks((b) => [...b, { id: uid(), title: newTitle.trim(), page: newPage, level: newLevel }])
    setNewTitle('')
  }

  const removeBookmark = (id: string) => setBookmarks((b) => b.filter((x) => x.id !== id))

  const moveBookmark = (id: string, dir: -1 | 1) => {
    setBookmarks((b) => {
      const idx = b.findIndex((x) => x.id === id)
      if (idx === -1) return b
      const target = idx + dir
      if (target < 0 || target >= b.length) return b
      const copy = [...b]
      ;[copy[idx], copy[target]] = [copy[target], copy[idx]]
      return copy
    })
  }

  const startEdit = (b: Bookmark) => { setEditingId(b.id); setEditTitle(b.title) }

  const commitEdit = (id: string) => {
    setBookmarks((b) => b.map((x) => (x.id === id ? { ...x, title: editTitle.trim() || x.title } : x)))
    setEditingId(null)
  }

  const levelLabel = (l: number) => l === 0 ? 'Main' : l === 1 ? 'Sub' : 'Sub-sub'

  const save = async () => {
    if (!pdf.file || !pdf.data || bookmarks.length === 0) { toast.error('Add at least one bookmark.'); return }
    setBusy(true)
    try {
      const doc = await PDFDocument.load(pdf.data, { ignoreEncryption: true })
      const pages = doc.getPages()
      const context = doc.context

      const outlineDict = context.obj({})
      const topRef = context.register(outlineDict)

      let prevRef: PDFRef | null = null

      for (const bm of bookmarks) {
        const dest = pages[bm.page - 1]?.ref
        if (!dest) continue

        const actionDict = context.obj({
          S: PDFName.of('GoTo'),
          D: context.obj([dest, PDFName.of('Fit')]),
        })
        const actionRef = context.register(actionDict)

        const bmDict = context.obj({
          Title: PDFString.of(bm.title),
          Parent: topRef,
          Action: actionRef,
          Count: PDFNumber.of(0),
        })

        if (bm.level > 0) {
          bmDict.set(PDFName.of('Level'), PDFNumber.of(bm.level))
        }

        const bmRef = context.register(bmDict)

        if (prevRef) {
          const prevDict = context.lookup(prevRef) as PDFDict
          prevDict.set(PDFName.of('Next'), bmRef)
          bmDict.set(PDFName.of('Prev'), prevRef)
        } else {
          outlineDict.set(PDFName.of('First'), bmRef)
        }

        prevRef = bmRef
      }

      if (prevRef) {
        outlineDict.set(PDFName.of('Last'), prevRef)
        outlineDict.set(PDFName.of('Count'), PDFNumber.of(bookmarks.length))
      }

      outlineDict.set(PDFName.of('Type'), PDFName.of('Outlines'))

      const catalog = context.lookup(context.trailerInfo.Root) as PDFDict
      catalog.set(PDFName.of('Outlines'), topRef)

      const bytes = await doc.save()
      downloadBlob(bytesToBlob(bytes, 'application/pdf'), `${baseName(pdf.file.name)}-bookmarks.pdf`)
      trackUsage({ toolId: 'pdf-bookmarks', toolName: 'PDF Bookmarks', action: 'Added bookmarks', fileName: pdf.file.name, inputSize: pdf.file.size })
      toast.success('Bookmarks saved.')
    } catch { toast.error('Failed to save bookmarks.') } finally { setBusy(false) }
  }

  if (!pdf.file || !pdf.data) {
    return (
      <div className="grid gap-3">
        <Dropzone accept={['application/pdf']} onFiles={(f) => pdf.load(f[0])} label="Drop a PDF to add bookmarks" icon={<BookmarkPlus className="h-8 w-8" />} />
        {pdf.error && <p className="text-sm text-rose-500">{pdf.error}</p>}
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <p className="text-sm font-medium">{pdf.file.name} · {pdf.count} pages</p>
          <button onClick={pdf.reset} className="btn-ghost btn-sm">Change file</button>
        </div>
        <div className="grid sm:grid-cols-[1fr_80px_90px_90px_auto] gap-3 items-end">
          <Field label="Bookmark title">
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addBookmark()} className="input" placeholder="e.g. Introduction" />
          </Field>
          <Field label="Page">
            <input type="number" min={1} max={pdf.count} value={newPage} onChange={(e) => setNewPage(+e.target.value)} className="input" />
          </Field>
          <Field label="Level">
            <select value={newLevel} onChange={(e) => setNewLevel(+e.target.value)} className="input">
              <option value={0}>Main</option>
              <option value={1}>Sub</option>
              <option value={2}>Sub-sub</option>
            </select>
          </Field>
          <button onClick={addBookmark} className="btn-primary btn-md h-10"><Plus className="h-4 w-4" /> Add</button>
          <button onClick={save} disabled={busy || bookmarks.length === 0} className="btn-primary btn-md h-10">{busy ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Save</button>
        </div>
      </div>

      {bookmarks.length > 0 && (
        <div className="card p-5">
          <p className="text-xs text-ink-500 dark:text-ink-400 mb-3">{bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} · drag or use arrows to reorder</p>
          <div className="grid gap-1.5">
            {bookmarks.map((b, i) => (
              <div key={b.id} className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 bg-ink-50 dark:bg-ink-800/50 group',
                b.level === 1 && 'ml-5',
                b.level === 2 && 'ml-10',
              )}>
                <span className="text-xs text-ink-400 w-4 text-right shrink-0">{i + 1}</span>
                {editingId === b.id ? (
                  <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onBlur={() => commitEdit(b.id)} onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(b.id); if (e.key === 'Escape') setEditingId(null) }} className="input flex-1 !py-1 !text-sm" />
                ) : (
                  <span className="flex-1 text-sm truncate">{b.title}</span>
                )}
                <span className="text-[11px] text-ink-400 shrink-0">p.{b.page}</span>
                <span className="text-[11px] text-ink-400 shrink-0 hidden sm:inline">{levelLabel(b.level)}</span>
                <div className="flex gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition">
                  <button onClick={() => moveBookmark(b.id, -1)} disabled={i === 0} className="btn-ghost !p-1 !h-auto disabled:opacity-30" aria-label="Move up"><ChevronUp className="h-3.5 w-3.5" /></button>
                  <button onClick={() => moveBookmark(b.id, 1)} disabled={i === bookmarks.length - 1} className="btn-ghost !p-1 !h-auto disabled:opacity-30" aria-label="Move down"><ChevronDown className="h-3.5 w-3.5" /></button>
                  <button onClick={() => startEdit(b)} className="btn-ghost !p-1 !h-auto" aria-label="Rename"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => removeBookmark(b.id)} className="btn-ghost !p-1 !h-auto text-rose-500" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
