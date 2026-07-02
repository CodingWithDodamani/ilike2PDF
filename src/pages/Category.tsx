import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Search, SlidersHorizontal } from 'lucide-react'
import { CATEGORY_META, SUBCATEGORY_META, toolsByCategory } from '@/lib/tools'
import { ToolCard } from '@/components/ToolCard'
import { cn } from '@/lib/utils'

type Pill = 'all' | 'live' | 'new'
type SortMode = 'default' | 'az' | 'za' | 'popular' | 'new'

const HOSTNAME = 'https://ilike2pdf.pages.dev'

export default function Category() {
  const { cat } = useParams()
  const [q, setQ] = useState('')
  const [sub, setSub] = useState<string | null>(null)
  const [pill, setPill] = useState<Pill>('all')
  const [sort, setSort] = useState<SortMode>('default')
  const [showSort, setShowSort] = useState(false)
  const meta = cat ? CATEGORY_META[cat] : undefined
  const tools = useMemo(() => (cat ? toolsByCategory(cat) : []), [cat])
  const subs = cat ? SUBCATEGORY_META[cat] ?? {} : {}

  const filtered = useMemo(() => {
    let f = tools

    // Subcategory filter
    if (sub) f = f.filter(t => t.sub === sub)

    // Pill filter
    if (pill === 'live') f = f.filter(t => t.popular)
    else if (pill === 'new') f = f.filter(t => t.isNew)

    // Search
    f = f.filter(t => (t.name + t.short + (t.keywords ?? []).join(' ')).toLowerCase().includes(q.toLowerCase()))

    // Sort
    if (sort === 'az') f = [...f].sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'za') f = [...f].sort((a, b) => b.name.localeCompare(a.name))
    else if (sort === 'popular') f = [...f].sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0))
    else if (sort === 'new') f = [...f].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))

    return f
  }, [tools, q, sub, pill, sort])

  if (!cat || !meta) return <Navigate to="/" replace />

  const url = `${HOSTNAME}/category/${cat}`
  const title = `${meta.label} — iLike2PDF`
  const description = `${meta.description} ${tools.length} free, private browser-based tools. No uploads, no tracking.`

  const subEntries = Object.entries(subs)

  const pills: { value: Pill; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: tools.length },
    { value: 'live', label: 'Live', count: tools.filter(t => t.popular).length },
    { value: 'new', label: 'New', count: tools.filter(t => t.isNew).length },
  ]

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: 'default', label: 'Default' },
    { value: 'az', label: 'A → Z' },
    { value: 'za', label: 'Z → A' },
    { value: 'popular', label: 'Popular first' },
    { value: 'new', label: 'New first' },
  ]

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:site_name" content="iLike2PDF" />
        <meta property="og:image" content={`${HOSTNAME}/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
      </Helmet>
      <div className="relative">
        <section className="relative grain">
          <div className="absolute inset-0 bg-mesh opacity-50 dark:opacity-80" aria-hidden />
          <div aria-hidden className="absolute inset-0 bg-grid-light dark:bg-grid-dark bg-grid [mask-image:radial-gradient(ellipse_60%_70%_at_50%_0%,#000_30%,transparent_100%)]" />
          <div className="relative section pt-10 pb-5 text-center">
            <span className={`relative inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${meta.gradient} text-white shadow-glow-sm`}>
              <span className="absolute inset-0 rounded-2xl bg-shine opacity-30" aria-hidden />
              <meta.icon className="relative h-7 w-7" />
            </span>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight mt-3">{meta.label}</h1>
            <p className="text-ink-500 dark:text-ink-400 mt-2 max-w-xl mx-auto text-sm">{meta.description}</p>

            <div className="flex items-center justify-center gap-2 mt-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder={`Search ${meta.label.toLowerCase()}…`}
                  className="input pl-10 text-sm w-full"
                  aria-label="Search tools"
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowSort(!showSort)}
                  className={cn('btn-ghost btn-sm !p-2 border border-ink-200 dark:border-ink-700', showSort && 'bg-ink-100 dark:bg-ink-800')}
                  aria-label="Sort tools"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
                {showSort && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-ink-850 rounded-xl border border-ink-200 dark:border-ink-700 shadow-xl min-w-[160px] overflow-hidden">
                      {sortOptions.map(o => (
                        <button
                          key={o.value}
                          onClick={() => { setSort(o.value); setShowSort(false) }}
                          className={cn(
                            'block w-full text-left text-xs px-4 py-2 hover:bg-ink-50 dark:hover:bg-ink-800 transition',
                            sort === o.value ? 'text-brand-500 font-semibold' : 'text-ink-600 dark:text-ink-300'
                          )}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Subcategory pills */}
            {subEntries.length > 0 && (
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                <button
                  onClick={() => setSub(null)}
                  className={cn(
                    'text-xs font-semibold px-3 py-1.5 rounded-full border transition',
                    !sub
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-transparent text-ink-500 border-ink-200 dark:border-ink-700 hover:border-brand-500'
                  )}
                >
                  All
                </button>
                {subEntries.map(([key, s]) => {
                  const count = tools.filter(t => t.sub === key).length
                  return (
                    <button
                      key={key}
                      onClick={() => setSub(sub === key ? null : key)}
                      className={cn(
                        'text-xs font-semibold px-3 py-1.5 rounded-full border transition inline-flex items-center gap-1.5',
                        sub === key
                          ? 'bg-brand-500 text-white border-brand-500'
                          : 'bg-transparent text-ink-500 border-ink-200 dark:border-ink-700 hover:border-brand-500'
                      )}
                    >
                      <s.icon className="h-3 w-3" />
                      {s.label}
                      <span className="opacity-70">({count})</span>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 mt-4">
              {pills.filter(p => p.count > 0).map(p => (
                <button
                  key={p.value}
                  onClick={() => setPill(p.value)}
                  className={cn(
                    'text-xs font-semibold px-3 py-1.5 rounded-full border transition',
                    pill === p.value
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-transparent text-ink-500 border-ink-200 dark:border-ink-700 hover:border-brand-500'
                  )}
                >
                  {p.label}
                  <span className="ml-1 opacity-70">({p.count})</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="section pb-12">
          {filtered.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 tl:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((t, i) => <ToolCard key={t.id} tool={t} index={i} />)}
            </div>
          ) : (
            <p className="text-center text-ink-500 py-16">No tools match your filters.</p>
          )}
        </div>
      </div>
    </>
  )
}
