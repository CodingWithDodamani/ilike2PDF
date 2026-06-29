import { useState, useRef, useCallback } from 'react'
import { Section, Segmented } from '@/components/ui'
import { cn } from '@/lib/utils'
import { Timer, RotateCcw } from 'lucide-react'

function formatTime(ms: number): string {
  const totalMs = Math.abs(ms)
  const minutes = Math.floor(totalMs / 60000)
  const seconds = Math.floor((totalMs % 60000) / 1000)
  const millis = Math.floor(totalMs % 1000)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

function parseDuration(h: number, m: number, s: number): number {
  return Math.max(0, h * 3600000 + m * 60000 + s * 1000)
}

function playBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    osc.type = 'sine'
    gain.gain.value = 0.3
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.stop(ctx.currentTime + 0.5)
    setTimeout(() => ctx.close(), 600)
  } catch {}
}

interface Lap {
  id: number
  totalMs: number
  diffMs: number
}

export default function Stopwatch() {
  const [mode, setMode] = useState<'stopwatch' | 'timer'>('stopwatch')

  const [swRunning, setSwRunning] = useState(false)
  const [swElapsed, setSwElapsed] = useState(0)
  const [laps, setLaps] = useState<Lap[]>([])

  const swStartTimeRef = useRef(0)
  const swAccumRef = useRef(0)
  const swRafRef = useRef(0)
  const lapIdRef = useRef(0)

  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [cdRunning, setCdRunning] = useState(false)
  const [cdRemaining, setCdRemaining] = useState(0)
  const [cdTotal, setCdTotal] = useState(0)
  const [cdFlash, setCdFlash] = useState(false)

  const cdEndTimeRef = useRef(0)
  const cdRafRef = useRef(0)

  const tickSw = useCallback(() => {
    const now = performance.now()
    const elapsed = swAccumRef.current + (now - swStartTimeRef.current)
    setSwElapsed(elapsed)
    swRafRef.current = requestAnimationFrame(tickSw)
  }, [])

  const handleSwStart = useCallback(() => {
    swStartTimeRef.current = performance.now()
    swRafRef.current = requestAnimationFrame(tickSw)
    setSwRunning(true)
  }, [tickSw])

  const handleSwPause = useCallback(() => {
    cancelAnimationFrame(swRafRef.current)
    swAccumRef.current = swElapsed
    setSwRunning(false)
  }, [swElapsed])

  const handleSwReset = useCallback(() => {
    cancelAnimationFrame(swRafRef.current)
    swAccumRef.current = 0
    setSwElapsed(0)
    setSwRunning(false)
    setLaps([])
    lapIdRef.current = 0
  }, [])

  const handleSwLap = useCallback(() => {
    if (!swRunning) return
    lapIdRef.current += 1
    const totalMs = swElapsed
    const prevTotal = laps.length > 0 ? laps[0].totalMs : 0
    setLaps((prev) => [
      { id: lapIdRef.current, totalMs, diffMs: totalMs - prevTotal },
      ...prev,
    ])
  }, [swRunning, swElapsed, laps])

  const tickCd = useCallback(() => {
    const remaining = cdEndTimeRef.current - performance.now()
    if (remaining <= 0) {
      cancelAnimationFrame(cdRafRef.current)
      setCdRemaining(0)
      setCdRunning(false)
      setCdFlash(true)
      playBeep()
      const flashTimer = setInterval(() => {
        setCdFlash((prev) => !prev)
      }, 500)
      setTimeout(() => {
        clearInterval(flashTimer)
        setCdFlash(false)
      }, 5000)
      return
    }
    setCdRemaining(remaining)
    cdRafRef.current = requestAnimationFrame(tickCd)
  }, [])

  const handleCdStart = useCallback(() => {
    const total = parseDuration(hours, minutes, seconds)
    if (total <= 0) return
    cdEndTimeRef.current = performance.now() + total
    setCdTotal(total)
    setCdRunning(true)
    cdRafRef.current = requestAnimationFrame(tickCd)
  }, [hours, minutes, seconds, tickCd])

  const handleCdPause = useCallback(() => {
    cancelAnimationFrame(cdRafRef.current)
    setSwRunning(false)
    setCdRunning(false)
  }, [])

  const handleCdResume = useCallback(() => {
    cdEndTimeRef.current = performance.now() + cdRemaining
    setCdRunning(true)
    cdRafRef.current = requestAnimationFrame(tickCd)
  }, [cdRemaining, tickCd])

  const handleCdReset = useCallback(() => {
    cancelAnimationFrame(cdRafRef.current)
    setCdRemaining(0)
    setCdTotal(0)
    setCdRunning(false)
    setCdFlash(false)
  }, [])

  const setPreset = useCallback((m: number) => {
    setHours(0)
    setMinutes(m)
    setSeconds(0)
  }, [])

  const displayTime = mode === 'stopwatch' ? swElapsed : cdRemaining

  return (
    <Section>
      <h2 className="text-lg font-semibold mb-1">Stopwatch & Timer</h2>
      <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">
        Precision stopwatch with lap tracking and countdown timer.
      </p>

      <div className="mb-6">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'stopwatch', label: 'Stopwatch' },
            { value: 'timer', label: 'Countdown' },
          ]}
        />
      </div>

      <div
        className={cn(
          'flex flex-col items-center justify-center py-10 rounded-xl bg-gradient-to-br from-ink-50 to-ink-100 dark:from-ink-900 dark:to-ink-800 mb-6 transition-all duration-300',
          mode === 'timer' && cdFlash && 'animate-pulse bg-red-100 dark:bg-red-900/40'
        )}
      >
        <Timer className="w-6 h-6 text-ink-400 dark:text-ink-500 mb-2" />
        <div
          className={cn(
            'text-5xl md:text-6xl font-mono font-bold tracking-tighter gradient-text select-none',
            mode === 'timer' && cdFlash && 'text-red-500'
          )}
        >
          {mode === 'stopwatch'
            ? formatTime(swElapsed)
            : cdTotal > 0
              ? formatTime(cdRemaining)
              : formatTime(parseDuration(hours, minutes, seconds))}
        </div>
        {mode === 'timer' && cdRunning && (
          <div className="text-xs text-ink-400 dark:text-ink-500 mt-2">
            {Math.floor((cdRemaining / cdTotal) * 100)}% remaining
          </div>
        )}
      </div>

      {mode === 'stopwatch' ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 justify-center">
            {!swRunning && swElapsed === 0 ? (
              <button
                onClick={handleSwStart}
                className="btn-primary btn-sm"
              >
                Start
              </button>
            ) : swRunning ? (
              <>
                <button onClick={handleSwPause} className="btn-secondary btn-sm">
                  Pause
                </button>
                <button onClick={handleSwLap} className="btn-secondary btn-sm">
                  Lap
                </button>
              </>
            ) : (
              <>
                <button onClick={handleSwStart} className="btn-primary btn-sm">
                  Resume
                </button>
                <button onClick={handleSwReset} className="btn-secondary btn-sm">
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Reset
                </button>
              </>
            )}
          </div>

          {laps.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {laps.map((lap, i) => (
                <div
                  key={lap.id}
                  className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-ink-50 dark:bg-ink-800/50"
                >
                  <span className="text-ink-500 dark:text-ink-400">
                    Lap {laps.length - i}
                  </span>
                  <span className="font-mono text-ink-700 dark:text-ink-200">
                    {formatTime(lap.diffMs)}
                  </span>
                  <span className="font-mono text-ink-400 dark:text-ink-500">
                    {formatTime(lap.totalMs)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {!cdRunning && cdRemaining === 0 ? (
            <>
              <div className="flex items-end gap-3 justify-center">
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, Math.min(99, +e.target.value)))}
                    className="w-16 text-center text-lg font-mono bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-ink-400 mt-1">hrs</span>
                </div>
                <span className="text-xl font-bold text-ink-300 dark:text-ink-600 pb-2">:</span>
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(0, Math.min(59, +e.target.value)))}
                    className="w-16 text-center text-lg font-mono bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-ink-400 mt-1">min</span>
                </div>
                <span className="text-xl font-bold text-ink-300 dark:text-ink-600 pb-2">:</span>
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={seconds}
                    onChange={(e) => setSeconds(Math.max(0, Math.min(59, +e.target.value)))}
                    className="w-16 text-center text-lg font-mono bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-ink-400 mt-1">sec</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {[1, 5, 10, 25, 30].map((m) => (
                  <button
                    key={m}
                    onClick={() => setPreset(m)}
                    className="btn-secondary btn-sm text-xs"
                  >
                    {m}min{m === 25 ? ' 🍅' : ''}
                  </button>
                ))}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleCdStart}
                  disabled={parseDuration(hours, minutes, seconds) <= 0}
                  className="btn-primary btn-sm"
                >
                  Start
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 justify-center">
              {!cdRunning ? (
                <>
                  <button onClick={handleCdResume} className="btn-primary btn-sm">
                    Resume
                  </button>
                  <button onClick={handleCdReset} className="btn-secondary btn-sm">
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Reset
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      cancelAnimationFrame(cdRafRef.current)
                      setCdRunning(false)
                    }}
                    className="btn-secondary btn-sm"
                  >
                    Pause
                  </button>
                  <button onClick={handleCdReset} className="btn-secondary btn-sm">
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Section>
  )
}
