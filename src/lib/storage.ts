// iLikePDF keeps zero history and zero analytics — like a pure tool site.
// trackUsage is intentionally a no-op so every tool can call it without storing anything.

export function trackUsage(_opts: {
  toolId: string
  toolName: string
  fileName?: string
  action: string
  inputSize?: number
  outputSize?: number
  files?: number
}): void {
  /* no-op: iLikePDF does not record any usage data */
}

// -------- Theme --------
const THEME_KEY = 'ilikepdf.theme'
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
