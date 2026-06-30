import { describe, it, expect } from 'vitest'
import { cn, formatBytes, baseName, extOf, parsePageRanges, clamp, todayKey } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })
  it('handles falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b')
  })
  it('returns empty string for no args', () => {
    expect(cn()).toBe('')
  })
})

describe('formatBytes', () => {
  it('returns 0 B for 0', () => {
    expect(formatBytes(0)).toBe('0 B')
  })
  it('returns 0 B for negative', () => {
    expect(formatBytes(-1)).toBe('0 B')
  })
  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 B')
  })
  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB')
  })
  it('formats megabytes', () => {
    expect(formatBytes(1048576)).toBe('1 MB')
  })
  it('formats gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1 GB')
  })
  it('formats with custom decimals', () => {
    expect(formatBytes(1536, 2)).toBe('1.5 KB')
  })
  it('formats fractional values', () => {
    expect(formatBytes(1234)).toBe('1.2 KB')
  })
})

describe('baseName', () => {
  it('removes extension', () => {
    expect(baseName('file.pdf')).toBe('file')
  })
  it('handles multiple dots', () => {
    expect(baseName('my.file.name.txt')).toBe('my.file.name')
  })
  it('handles no extension', () => {
    expect(baseName('noext')).toBe('noext')
  })
})

describe('extOf', () => {
  it('extracts lowercase extension', () => {
    expect(extOf('file.PDF')).toBe('pdf')
  })
  it('returns empty for no extension', () => {
    expect(extOf('noext')).toBe('')
  })
  it('handles complex names', () => {
    expect(extOf('image.jpeg')).toBe('jpeg')
  })
})

describe('parsePageRanges', () => {
  it('parses single pages', () => {
    expect(parsePageRanges('1,3,5', 10)).toEqual([0, 2, 4])
  })
  it('parses ranges', () => {
    expect(parsePageRanges('1-3', 10)).toEqual([0, 1, 2])
  })
  it('parses mixed ranges and singles', () => {
    expect(parsePageRanges('1-3, 5, 8-10', 10)).toEqual([0, 1, 2, 4, 7, 8, 9])
  })
  it('deduplicates pages', () => {
    expect(parsePageRanges('1,1,2,2', 10)).toEqual([0, 1])
  })
  it('sorts results', () => {
    expect(parsePageRanges('5,1,3', 10)).toEqual([0, 2, 4])
  })
  it('clamps to total pages', () => {
    expect(parsePageRanges('1-100', 5)).toEqual([0, 1, 2, 3, 4])
  })
  it('ignores invalid pages', () => {
    expect(parsePageRanges('0, -1, abc', 10)).toEqual([])
  })
  it('swaps inverted ranges', () => {
    expect(parsePageRanges('5-2', 10)).toEqual([1, 2, 3, 4])
  })
  it('handles empty input', () => {
    expect(parsePageRanges('', 10)).toEqual([])
  })
  it('handles spaces', () => {
    expect(parsePageRanges(' 1 - 3 , 5 ', 10)).toEqual([0, 1, 2, 4])
  })
})

describe('clamp', () => {
  it('clamps below min', () => {
    expect(clamp(-5, 0, 100)).toBe(0)
  })
  it('clamps above max', () => {
    expect(clamp(150, 0, 100)).toBe(100)
  })
  it('returns value in range', () => {
    expect(clamp(50, 0, 100)).toBe(50)
  })
  it('returns min at boundary', () => {
    expect(clamp(0, 0, 100)).toBe(0)
  })
  it('returns max at boundary', () => {
    expect(clamp(100, 0, 100)).toBe(100)
  })
})

describe('todayKey', () => {
  it('returns YYYY-MM-DD format', () => {
    const key = todayKey(new Date('2025-06-15T12:00:00'))
    expect(key).toBe('2025-06-15')
  })
  it('pads single digits', () => {
    const key = todayKey(new Date('2025-01-05T12:00:00'))
    expect(key).toBe('2025-01-05')
  })
})
