import { useState, useCallback, useMemo } from 'react'
import { Copy, Check, Download, Trash2, Braces, Minus, ListTree } from 'lucide-react'
import { Section } from '@/components/ui'
import { cn } from '@/lib/utils'
import { downloadDataUrl } from '@/lib/utils'

type ViewMode = 'formatted' | 'minified' | 'tree'

interface TreeNode {
  key: string | number
  value: any
  type: 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array'
  children?: TreeNode[]
  path: string
}

function parseJson(input: string): any {
  return JSON.parse(input)
}

function buildTree(data: any, key: string | number = 'root', path = '$'): TreeNode {
  if (data === null) return { key, value: null, type: 'null', path }
  if (Array.isArray(data)) {
    return {
      key,
      value: data,
      type: 'array',
      path,
      children: data.map((item, i) => buildTree(item, i, `${path}[${i}]`)),
    }
  }
  if (typeof data === 'object') {
    return {
      key,
      value: data,
      type: 'object',
      path,
      children: Object.entries(data).map(([k, v]) => buildTree(v, k, `${path}.${k}`)),
    }
  }
  return { key, value: data, type: typeof data as any, path }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'string': return 'text-emerald-600 dark:text-emerald-400'
    case 'number': return 'text-blue-600 dark:text-blue-400'
    case 'boolean': return 'text-amber-600 dark:text-amber-400'
    case 'null': return 'text-ink-400 dark:text-ink-500'
    default: return 'text-ink-700 dark:text-ink-200'
  }
}

function TreeView({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [collapsed, setCollapsed] = useState(depth > 2)
  const isContainer = node.type === 'object' || node.type === 'array'
  const childCount = node.children?.length ?? 0

  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <div className="flex items-center gap-1 py-0.5 hover:bg-ink-100 dark:hover:bg-ink-800 rounded px-1 group">
        {isContainer && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 text-xs w-4 shrink-0"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '▶' : '▼'}
          </button>
        )}
        {!isContainer && <span className="w-4 shrink-0" />}

        {node.key !== 'root' && (
          <span className="text-ink-600 dark:text-ink-300 font-mono text-sm mr-1">
            {typeof node.key === 'string' ? `"${node.key}"` : node.key}:
          </span>
        )}

        {isContainer ? (
          <span className="text-ink-500 dark:text-ink-400 text-sm font-mono">
            {node.type === 'array' ? '[' : '{'}
            {!collapsed && <span className="text-ink-400 text-xs ml-1">{childCount} items</span>}
          </span>
        ) : (
          <span className={cn('font-mono text-sm', getTypeColor(node.type))}>
            {node.type === 'string' ? `"${String(node.value).slice(0, 100)}${String(node.value).length > 100 ? '...' : ''}"` : String(node.value)}
          </span>
        )}

        {!isContainer && (
          <button
            onClick={() => navigator.clipboard.writeText(String(node.value))}
            className="opacity-0 group-hover:opacity-100 ml-1 text-ink-400 hover:text-brand-500 transition"
            aria-label="Copy value"
          >
            <Copy className="w-3 h-3" />
          </button>
        )}
      </div>

      {isContainer && !collapsed && node.children?.map((child, i) => (
        <TreeView key={`${child.path}-${i}`} node={child} depth={depth + 1} />
      ))}

      {isContainer && !collapsed && (
        <div style={{ paddingLeft: depth * 16 }} className="text-ink-500 dark:text-ink-400 text-sm font-mono py-0.5">
          {node.type === 'array' ? ']' : '}'}
        </div>
      )}
    </div>
  )
}

export default function JsonFormatter() {
  const [input, setInput] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('formatted')
  const [indent, setIndent] = useState(2)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const parsed = useMemo(() => {
    if (!input.trim()) { setError(''); return null }
    try {
      const data = parseJson(input)
      setError('')
      return data
    } catch (e: any) {
      setError(e.message)
      return null
    }
  }, [input])

  const formatted = useMemo(() => {
    if (parsed === null) return ''
    if (viewMode === 'minified') return JSON.stringify(parsed)
    return JSON.stringify(parsed, null, indent)
  }, [parsed, viewMode, indent])

  const tree = useMemo(() => {
    if (parsed === null) return null
    return buildTree(parsed)
  }, [parsed])

  const stats = useMemo(() => {
    if (!input.trim()) return null
    try {
      const data = JSON.parse(input)
      const keys = new Set<string>()
      const count = (obj: any): { objects: number; arrays: number; primitives: number } => {
        if (obj === null) return { objects: 0, arrays: 0, primitives: 1 }
        if (Array.isArray(obj)) {
          let o = 0, a = 1, p = 0
          for (const item of obj) {
            const s = count(item)
            o += s.objects; a += s.arrays; p += s.primitives
          }
          return { objects: o, arrays: a, primitives: p }
        }
        if (typeof obj === 'object') {
          let o = 1, a = 0, p = 0
          for (const [k, v] of Object.entries(obj)) {
            keys.add(k)
            const s = count(v)
            o += s.objects; a += s.arrays; p += s.primitives
          }
          return { objects: o, arrays: a, primitives: p }
        }
        return { objects: 0, arrays: 0, primitives: 1 }
      }
      const stats = count(data)
      return { keys: keys.size, ...stats, size: new TextEncoder().encode(input).length }
    } catch {
      return null
    }
  }, [input])

  const copy = useCallback(() => {
    navigator.clipboard.writeText(formatted)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [formatted])

  const download = useCallback(() => {
    const blob = new Blob([formatted], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    downloadDataUrl(url, 'formatted.json')
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }, [formatted])

  const formatJson = useCallback(() => {
    try {
      const data = JSON.parse(input)
      setInput(JSON.stringify(data, null, 2))
    } catch {}
  }, [input])

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">JSON Formatter</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
        Validate, pretty-print, minify, and explore JSON with tree view. Copy or download results.
      </p>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="flex rounded-xl bg-ink-100 dark:bg-ink-850 p-1">
          {([
            { value: 'formatted', label: 'Formatted', icon: Braces },
            { value: 'minified', label: 'Minified', icon: Minus },
            { value: 'tree', label: 'Tree View', icon: ListTree },
          ] as const).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setViewMode(value)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5',
                viewMode === value
                  ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-300 shadow'
                  : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {viewMode === 'formatted' && (
          <div className="flex rounded-xl bg-ink-100 dark:bg-ink-850 p-1">
            {[2, 4, 8].map(n => (
              <button
                key={n}
                onClick={() => setIndent(n)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition',
                  indent === n
                    ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-300 shadow'
                    : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white'
                )}
              >
                {n} spaces
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-1.5 ml-auto">
          <button
            onClick={formatJson}
            disabled={!input.trim()}
            className="btn-ghost px-3 py-2 text-sm rounded-lg disabled:opacity-40"
          >
            Auto-Format
          </button>
          <button onClick={copy} disabled={!formatted} className="btn-ghost px-3 py-2 text-sm rounded-lg disabled:opacity-40 flex items-center gap-1.5">
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button onClick={download} disabled={!formatted} className="btn-ghost px-3 py-2 text-sm rounded-lg disabled:opacity-40 flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <textarea
          className="input w-full h-64 font-mono text-sm resize-y"
          placeholder='Paste JSON here...\n\nExample: {"name": "John", "age": 30, "items": [1, 2, 3]}'
          value={input}
          onChange={e => setInput(e.target.value)}
          spellCheck={false}
          aria-label="JSON input"
        />
        {input && (
          <button
            onClick={() => { setInput(''); setError('') }}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-ink-100 dark:bg-ink-800 text-ink-400 hover:text-red-500 transition"
            aria-label="Clear input"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 text-sm font-mono">
          {error}
        </div>
      )}

      {/* Stats */}
      {stats && !error && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-500 dark:text-ink-400">
          <span>{stats.size.toLocaleString()} bytes</span>
          <span>{stats.keys} keys</span>
          <span>{stats.objects} objects</span>
          <span>{stats.arrays} arrays</span>
          <span>{stats.primitives} primitives</span>
        </div>
      )}

      {/* Output */}
      {parsed !== null && !error && (
        <div className="mt-4">
          <p className="label mb-2">Output</p>
          <div className="card p-4 max-h-96 overflow-auto bg-ink-50 dark:bg-ink-900">
            {viewMode === 'tree' && tree ? (
              <TreeView node={tree} />
            ) : (
              <pre className="font-mono text-sm whitespace-pre-wrap break-words text-ink-700 dark:text-ink-200">
                {formatted}
              </pre>
            )}
          </div>
        </div>
      )}
    </Section>
  )
}
