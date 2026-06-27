import type { LucideIcon } from 'lucide-react'

export type ToolCategory = 'pdf' | 'image' | 'qr' | 'utility'

export interface ToolDef {
  id: string
  slug: string
  name: string
  short: string
  description: string
  category: ToolCategory
  icon: LucideIcon
  accept?: string[] // file extensions / mime hints
  multiple?: boolean
  popular?: boolean
  keywords?: string[]
}


