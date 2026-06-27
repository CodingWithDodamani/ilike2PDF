import { Link } from 'react-router-dom'
import { Home, Search, Compass } from 'lucide-react'
import { popularTools } from '@/lib/tools'

export default function NotFound() {
  const picks = popularTools().slice(0, 6)
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="text-[6rem] sm:text-[9rem] font-black leading-none gradient-text select-none">404</p>
      <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">This page wandered off</h1>
      <p className="text-ink-500 dark:text-ink-400 mt-3 max-w-md mx-auto">
        The page you’re looking for doesn’t exist or may have moved. Let’s get you back to work.
      </p>

      <div className="flex items-center justify-center gap-3 mt-7 flex-wrap">
        <Link to="/" className="btn-primary"><Home className="h-4 w-4" /> Back home</Link>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
          className="btn-secondary"
        >
          <Search className="h-4 w-4" /> Search tools (Ctrl K)
        </button>
      </div>

      <div className="mt-12">
        <p className="text-sm font-medium text-ink-500 flex items-center justify-center gap-2 mb-4">
          <Compass className="h-4 w-4" /> Popular tools
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
          {picks.map((t) => {
            const Icon = t.icon
            return (
              <Link key={t.slug} to={`/tool/${t.slug}`} className="card p-4 flex items-center gap-3 hover:border-brand-500/50 transition group">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/10 text-brand-500 shrink-0">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-brand-500 transition">{t.name}</p>
                  <p className="text-xs text-ink-500 truncate">{t.short}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
