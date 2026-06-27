import { useState, useCallback } from 'react'
import { PDFDocument } from 'pdf-lib'
import { fileToArrayBuffer } from '@/lib/utils'

export function usePdfFile() {
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<ArrayBuffer | null>(null)
  const [count, setCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (f: File): Promise<boolean> => {
    setError(null)
    try {
      const buf = await fileToArrayBuffer(f)
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
      setFile(f); setData(buf); setCount(doc.getPageCount())
      return true
    } catch {
      setError('Could not read this PDF. It may be encrypted or corrupt.')
      return false
    }
  }, [])

  const reset = useCallback(() => { setFile(null); setData(null); setCount(0); setError(null) }, [])
  return { file, data, count, error, load, reset }
}
