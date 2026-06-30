// iLike2PDF keeps all analytics local — zero external calls, zero tracking.
// Everything stays in the user's browser via localStorage.

export function trackUsage(opts: {
  toolId: string
  toolName: string
  fileName?: string
  action: string
  inputSize?: number
  outputSize?: number
  files?: number
}): void {
  try {
    const analytics = readAnalytics()
    analytics.filesProcessed += opts.files ?? 1
    analytics.bytesProcessed += opts.inputSize ?? 0
    analytics.bytesSaved += opts.inputSize && opts.outputSize
      ? Math.max(0, opts.inputSize - opts.outputSize)
      : 0
    analytics.toolUsage[opts.toolId] = (analytics.toolUsage[opts.toolId] || 0) + 1
    const day = todayKey()
    analytics.daily[day] = (analytics.daily[day] || 0) + 1
    writeAnalytics(analytics)

    addHistoryEntry({
      toolId: opts.toolId,
      toolName: opts.toolName,
      fileName: opts.fileName,
      action: opts.action,
      timestamp: Date.now(),
    })

    addRecentTool(opts.toolId)
  } catch {
    /* ignore quota / private mode */
  }
}

// -------- Analytics --------
const ANALYTICS_KEY = 'snappdf.analytics'

export interface AnalyticsState {
  filesProcessed: number
  bytesProcessed: number
  bytesSaved: number
  toolUsage: Record<string, number>
  daily: Record<string, number>
}

function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

function readAnalytics(): AnalyticsState {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY)
    if (raw) return JSON.parse(raw) as AnalyticsState
  } catch { /* ignore */ }
  return { filesProcessed: 0, bytesProcessed: 0, bytesSaved: 0, toolUsage: {}, daily: {} }
}

function writeAnalytics(data: AnalyticsState) {
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

export function getAnalytics(): AnalyticsState {
  return readAnalytics()
}

export function clearAnalytics() {
  try {
    localStorage.removeItem(ANALYTICS_KEY)
  } catch { /* ignore */ }
}

// -------- History --------
const HISTORY_KEY = 'snappdf.history'
const MAX_HISTORY = 50

export interface HistoryEntry {
  toolId: string
  toolName: string
  fileName?: string
  action: string
  timestamp: number
}

function readHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) return JSON.parse(raw) as HistoryEntry[]
  } catch { /* ignore */ }
  return []
}

function writeHistory(data: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

function addHistoryEntry(entry: HistoryEntry) {
  const history = readHistory()
  history.unshift(entry)
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY
  writeHistory(history)
}

export function getHistory(): HistoryEntry[] {
  return readHistory()
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch { /* ignore */ }
}

// -------- Recent Tools --------
const RECENT_KEY = 'snappdf.recentTools'
const MAX_RECENT = 8

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (raw) return JSON.parse(raw) as string[]
  } catch { /* ignore */ }
  return []
}

function writeRecent(data: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

function addRecentTool(toolId: string) {
  const recent = readRecent().filter((id) => id !== toolId)
  recent.unshift(toolId)
  if (recent.length > MAX_RECENT) recent.length = MAX_RECENT
  writeRecent(recent)
}

export function getRecentTools(): string[] {
  return readRecent()
}

// -------- Theme --------
const THEME_KEY = 'ilike2pdf.theme'
export type ThemeMode = 'light' | 'dark' | 'system'

function readTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    return raw ? (JSON.parse(raw) as ThemeMode) : 'light'
  } catch {
    return 'light'
  }
}

export function getTheme(): ThemeMode {
  return readTheme()
}

export function setTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify(mode))
  } catch {
    /* ignore quota / private mode */
  }
  applyTheme(mode)
}

export function applyTheme(mode: ThemeMode) {
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = mode === 'dark' || (mode === 'system' && sysDark)
  document.documentElement.classList.toggle('dark', dark)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#0b0b14' : '#6d28d9')
}
