import type { IconType } from 'react-icons'

export type ToolCategory = 'pdf' | 'image' | 'qr' | 'utility' | 'dev'

export interface ToolDef {
  id: string
  slug: string
  name: string
  short: string
  description: string
  category: ToolCategory
  sub?: string
  icon: IconType
  accept?: string[] // file extensions / mime hints
  multiple?: boolean
  popular?: boolean
  isNew?: boolean
  keywords?: string[]
}


