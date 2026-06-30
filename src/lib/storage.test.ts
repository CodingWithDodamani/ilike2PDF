import { describe, it, expect, beforeEach, vi } from 'vitest'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  }
})()

vi.stubGlobal('localStorage', localStorageMock)

// Must import after stubbing localStorage
const { trackUsage, getAnalytics, clearAnalytics, getHistory, clearHistory, getRecentTools } = await import('./storage')

describe('trackUsage', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('records a usage entry to analytics', () => {
    trackUsage({
      toolId: 'merge-pdf',
      toolName: 'Merge PDF',
      action: 'merge',
      inputSize: 1000,
      outputSize: 800,
      files: 2,
    })

    const analytics = getAnalytics()
    expect(analytics.filesProcessed).toBe(2)
    expect(analytics.bytesProcessed).toBe(1000)
    expect(analytics.bytesSaved).toBe(200)
    expect(analytics.toolUsage['merge-pdf']).toBe(1)
  })

  it('accumulates usage across calls', () => {
    trackUsage({ toolId: 'merge-pdf', toolName: 'Merge PDF', action: 'merge', inputSize: 500 })
    trackUsage({ toolId: 'split-pdf', toolName: 'Split PDF', action: 'split', inputSize: 300 })
    trackUsage({ toolId: 'merge-pdf', toolName: 'Merge PDF', action: 'merge', inputSize: 200 })

    const analytics = getAnalytics()
    expect(analytics.filesProcessed).toBe(3)
    expect(analytics.bytesProcessed).toBe(1000)
    expect(analytics.toolUsage['merge-pdf']).toBe(2)
    expect(analytics.toolUsage['split-pdf']).toBe(1)
  })

  it('records daily usage', () => {
    trackUsage({ toolId: 'merge-pdf', toolName: 'Merge PDF', action: 'merge' })

    const analytics = getAnalytics()
    const today = new Date().toISOString().slice(0, 10)
    expect(analytics.daily[today]).toBe(1)
  })

  it('adds to history', () => {
    trackUsage({ toolId: 'merge-pdf', toolName: 'Merge PDF', action: 'merge', fileName: 'test.pdf' })

    const history = getHistory()
    expect(history).toHaveLength(1)
    expect(history[0].toolId).toBe('merge-pdf')
    expect(history[0].fileName).toBe('test.pdf')
  })

  it('adds to recent tools', () => {
    trackUsage({ toolId: 'merge-pdf', toolName: 'Merge PDF', action: 'merge' })
    trackUsage({ toolId: 'split-pdf', toolName: 'Split PDF', action: 'split' })

    const recent = getRecentTools()
    expect(recent).toEqual(['split-pdf', 'merge-pdf'])
  })

  it('deduplicates recent tools', () => {
    trackUsage({ toolId: 'merge-pdf', toolName: 'Merge PDF', action: 'merge' })
    trackUsage({ toolId: 'split-pdf', toolName: 'Split PDF', action: 'split' })
    trackUsage({ toolId: 'merge-pdf', toolName: 'Merge PDF', action: 'merge' })

    const recent = getRecentTools()
    expect(recent).toEqual(['merge-pdf', 'split-pdf'])
  })
})

describe('clearAnalytics', () => {
  it('resets analytics to zero', () => {
    trackUsage({ toolId: 'merge-pdf', toolName: 'Merge PDF', action: 'merge', inputSize: 1000 })
    clearAnalytics()
    const analytics = getAnalytics()
    expect(analytics.filesProcessed).toBe(0)
    expect(analytics.bytesProcessed).toBe(0)
    expect(analytics.toolUsage).toEqual({})
  })
})

describe('clearHistory', () => {
  it('empties history', () => {
    trackUsage({ toolId: 'merge-pdf', toolName: 'Merge PDF', action: 'merge' })
    clearHistory()
    expect(getHistory()).toEqual([])
  })
})
