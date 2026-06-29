import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Search } from 'lucide-react'
import { CATEGORY_META, toolsByCategory } from '@/lib/tools'
import { ToolCard } from '@/components/ToolCard'

const HOSTNAME = 'https://ilikepdf.pages.dev'

export default function Category() {
  const { cat } = useParams()
  const [q, setQ] = useState('')

  if (!cat || !CATEGORY_META[cat]) return <Navigate to="/" replace />
  const meta = CATEGORY_META[cat]
  const tools = useMemo(() => toolsByCategory(cat), [cat])
  const filtered = useMemo(
    () => tools.filter((t) => (t.name + t.short + (t.keywords ?? []).join(' ')).toLowerCase().includes(q.toLowerCase())),
    [tools, q]
  )

  const url = `${HOSTNAME}/category/${cat}`
  const title = `${meta.label} — iLikePDF`
  const description = `${meta.description} ${tools.length} free, private browser-based tools. No uploads, no tracking.`

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
        <meta property="og:site_name" content="iLikePDF" />
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

            <div className="relative max-w-md mx-auto mt-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder={`Search ${meta.label.toLowerCase()}…`}
                className="input pl-10 text-sm"
                aria-label="Search tools"
              />
            </div>
          </div>
        </section>

        <div className="section pb-12">
          <div className="grid gap-3 sm:grid-cols-2 tl:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((t, i) => <ToolCard key={t.id} tool={t} index={i} />)}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-ink-500 py-16">No tools match “{q}”.</p>
          )}
        </div>
      </div>
    </>
  )
}
