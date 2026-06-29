import { useState, useCallback, useMemo } from 'react'
import { Download, Copy, Check, ArrowUpDown, Upload } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'
import Papa from 'papaparse'

export default function CsvViewer() {
  const [data, setData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [copied, setCopied] = useState(false)
  const [fileName, setFileName] = useState('')
  const pageSize = 50

  const handleFile = useCallback((file: File) => {
    setFileName(file.name)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data as any[])
        setHeaders(results.meta.fields || [])
        setPage(0)
        setSortCol(null)
      },
    })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = Array.from(e.dataTransfer.files).find(f => f.name.endsWith('.csv') || f.type === 'text/csv')
    if (file) handleFile(file)
  }, [handleFile])

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }, [handleFile])

  const sorted = useMemo(() => {
    let result = [...data]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(q)))
    }
    if (sortCol !== null) {
      const key = headers[sortCol]
      result.sort((a, b) => {
        const av = a[key] || '', bv = b[key] || ''
        const an = parseFloat(av), bn = parseFloat(bv)
        if (!isNaN(an) && !isNaN(bn)) return sortDir === 'asc' ? an - bn : bn - an
        return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
      })
    }
    return result
  }, [data, headers, sortCol, sortDir, search])

  const paged = useMemo(() => sorted.slice(page * pageSize, (page + 1) * pageSize), [sorted, page])
  const totalPages = Math.ceil(sorted.length / pageSize)

  const toggleSort = (col: number) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const copyTable = () => {
    const text = [headers.join('\t'), ...sorted.map(row => headers.map(h => row[h] || '').join('\t'))].join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const downloadCsv = () => {
    const csv = Papa.unparse({ fields: headers, data: sorted })
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = fileName || 'data.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">CSV Viewer & Editor</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        View, sort, search, and export CSV files. Handles large datasets with pagination.
      </p>

      {data.length === 0 ? (
        <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}
          className="border-2 border-dashed rounded-xl p-8 text-center border-ink-300 dark:border-ink-600 hover:border-brand-500 transition cursor-pointer">
          <input type="file" accept=".csv,text/csv" onChange={handleInput} className="hidden" id="csv-input" />
          <label htmlFor="csv-input" className="cursor-pointer">
            <Upload className="w-10 h-10 mx-auto mb-3 text-ink-400" />
            <p className="text-sm font-medium">Drop a CSV file or click to browse</p>
          </label>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-sm text-ink-500">{sorted.length.toLocaleString()} rows × {headers.length} columns</span>
            <input type="text" className="input flex-1 min-w-[200px] text-sm py-1.5" placeholder="Search..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
            <button onClick={copyTable} className="btn-ghost px-3 py-1.5 text-sm rounded-lg flex items-center gap-1">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              Copy
            </button>
            <button onClick={downloadCsv} className="btn-ghost px-3 py-1.5 text-sm rounded-lg flex items-center gap-1">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto rounded-xl border border-ink-200 dark:border-ink-700">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-ink-100 dark:bg-ink-800 z-10">
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} onClick={() => toggleSort(i)}
                      className="px-3 py-2 text-left text-xs font-medium text-ink-500 uppercase cursor-pointer hover:text-brand-500 transition whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        {h}
                        {sortCol === i && <ArrowUpDown className="w-3 h-3" />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {paged.map((row, i) => (
                  <tr key={i} className="hover:bg-ink-50 dark:hover:bg-ink-900/50">
                    {headers.map((h, j) => (
                      <td key={j} className="px-3 py-2 text-ink-700 dark:text-ink-200 whitespace-nowrap max-w-[200px] truncate">
                        {row[h] || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-ink-400">Page {page + 1} of {totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(0)} disabled={page === 0}
                  className="btn-ghost px-2 py-1 text-xs rounded-lg disabled:opacity-40">First</button>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="btn-ghost px-2 py-1 text-xs rounded-lg disabled:opacity-40">Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="btn-ghost px-2 py-1 text-xs rounded-lg disabled:opacity-40">Next</button>
                <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
                  className="btn-ghost px-2 py-1 text-xs rounded-lg disabled:opacity-40">Last</button>
              </div>
            </div>
          )}
        </>
      )}
    </Section>
  )
}
