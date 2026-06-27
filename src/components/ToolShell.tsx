import { Link } from 'react-router-dom'
import { ChevronRight, Shield } from 'lucide-react'
import type { ToolDef } from '@/lib/types'
import { CATEGORY_META } from '@/lib/tools'

export function ToolShell({ tool, children }: { tool: ToolDef; children: React.ReactNode }) {
  const Icon = tool.icon
  const meta = CATEGORY_META[tool.category]
  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-6 pt-6 pb-10">
      <nav className="flex items-center gap-1.5 text-xs text-ink-500 mb-5" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-brand-500 transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3 text-ink-400" aria-hidden />
        <Link to={`/category/${tool.category}`} className="hover:text-brand-500 transition-colors">{meta.label}</Link>
        <ChevronRight className="h-3 w-3 text-ink-400" aria-hidden />
        <span className="text-ink-700 dark:text-ink-300 font-medium" aria-current="page">{tool.name}</span>
      </nav>

      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${meta.gradient} text-white shrink-0`}>
            <Icon className="h-5 w-5" />
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight">{tool.name}</h1>
        </div>
        <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 rounded-full px-3 py-1 shrink-0">
          <Shield className="h-3 w-3" /> 100% Private
        </div>
      </div>

      <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed mb-5">{tool.description}</p>

      {children}
    </div>
  )
}
