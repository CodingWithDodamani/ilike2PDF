import { useCallback, useRef, useState } from 'react'

interface TouchDndOpts {
  onReorder: (from: number, to: number) => void
  longPressMs?: number
}

export function useTouchDnd({ onReorder, longPressMs = 400 }: TouchDndOpts) {
  const [dragging, setDragging] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fromRef = useRef<number | null>(null)
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map())

  const register = useCallback((idx: number, el: HTMLElement | null) => {
    if (el) itemRefs.current.set(idx, el)
    else itemRefs.current.delete(idx)
  }, [])

  const clear = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    fromRef.current = null
    setDragging(null)
    setOver(null)
  }

  const onTouchStart = useCallback((idx: number, e: React.TouchEvent) => {
    e.stopPropagation()
    timerRef.current = setTimeout(() => {
      fromRef.current = idx
      setDragging(idx)
      if (navigator.vibrate) navigator.vibrate(30)
    }, longPressMs)
  }, [longPressMs])

  const onTouchMove = useCallback((idx: number, e: React.TouchEvent) => {
    if (fromRef.current === null) { clear(); return }
    const touch = e.touches[0]
    let closest = idx
    let minDist = Infinity
    itemRefs.current.forEach((el, i) => {
      if (i === fromRef.current) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const d = Math.hypot(touch.clientX - cx, touch.clientY - cy)
      if (d < minDist) { minDist = d; closest = i }
    })
    setOver(closest)
  }, [])

  const onTouchEnd = useCallback((_idx: number, _e: React.TouchEvent) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    if (fromRef.current !== null && over !== null && fromRef.current !== over) {
      onReorder(fromRef.current, over)
    }
    clear()
  }, [over, onReorder])

  const isDragging = dragging !== null

  return { register, dragging, over, isDragging, onTouchStart, onTouchMove, onTouchEnd, clear }
}
