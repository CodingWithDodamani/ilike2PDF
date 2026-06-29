import { Link } from 'react-router-dom'
import { ChevronRight, Shield } from 'lucide-react'
import type { ToolDef } from '@/lib/types'
import { CATEGORY_META } from '@/lib/tools'

export function ToolShell({ tool, children }: { tool: ToolDef; children: React.ReactNode }) {
  const Icon = tool.icon
  const meta = CATEGORY_META[tool.category]
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 pt-5 pb-8">
      <nav className="flex items-center gap-1.5 text-[11px] text-ink-500 mb-3" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-brand-500 transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3 text-ink-400" aria-hidden />
        <Link to={`/category/${tool.category}`} className="hover:text-brand-500 transition-colors">{meta.label}</Link>
        <ChevronRight className="h-3 w-3 text-ink-400" aria-hidden />
        <span className="text-ink-700 dark:text-ink-300 font-medium" aria-current="page">{tool.name}</span>
      </nav>

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${meta.gradient} text-white shrink-0`}>
            <Icon className="h-4 w-4" />
          </div>
          <h1 className="font-display text-lg sm:text-xl font-extrabold tracking-tight">{tool.name}</h1>
        </div>
        <div className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 rounded-full px-2.5 py-0.5 shrink-0">
          <Shield className="h-3 w-3" /> 100% Private
        </div>
      </div>

      <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed mb-4">{tool.description}</p>

      <div className="lg:grid lg:grid-cols-[1fr_200px] lg:gap-6">
        <div className="min-w-0">
          {children}
        </div>
        <aside className="hidden lg:block" aria-hidden="true" />
      </div>
    </div>
  )
}
