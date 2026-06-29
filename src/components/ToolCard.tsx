import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { ToolDef } from '@/lib/types'
import { CATEGORY_META } from '@/lib/tools'

export function ToolCard({ tool, index = 0 }: { tool: ToolDef; index?: number }) {
  const Icon = tool.icon
  const meta = CATEGORY_META[tool.category]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.4 }}
    >
      <Link
        to={`/tool/${tool.slug}`}
        className="group card card-hover p-4 sm:p-5 h-full flex flex-col focus-ring relative overflow-hidden"
      >
        <div className={`absolute -top-14 -right-14 h-32 w-32 rounded-full bg-gradient-to-br ${meta.gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-300`} />
        <div className={`relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${meta.gradient} text-white shadow-lg mb-3 group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300`}>
          <span className="absolute inset-0 rounded-xl bg-shine opacity-30" aria-hidden />
          <Icon className="relative h-5 w-5" />
        </div>
        <h3 className="font-display font-bold text-sm text-ink-900 dark:text-ink-50 flex items-center gap-2">
          {tool.name}
          {tool.popular && <span className="badge-gold">Hot</span>}
        </h3>
        <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 flex-1 leading-relaxed">{tool.short}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-500 sm:opacity-0 sm:group-hover:opacity-100 sm:-translate-x-2 sm:group-hover:translate-x-0 transition-all duration-300">
          Open tool <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </Link>
    </motion.div>
  )
}
