import { useState } from 'react'

export function BeforeAfter({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50)
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700 select-none bg-[repeating-conic-gradient(#e5e5e5_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
      <img src={after} alt="After" loading="lazy" decoding="async" className="block w-full max-h-80 object-contain" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={before} alt="Before" loading="lazy" decoding="async" className="block h-full w-auto max-w-none object-contain" style={{ width: `${100 / (pos / 100)}%` }} />
      </div>
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white shadow grid place-items-center text-brand-600 text-xs font-bold">↔</div>
      </div>
      <span className="absolute top-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded bg-ink-900/70 text-white">Before</span>
      <span className="absolute top-2 right-2 text-[11px] font-bold px-2 py-0.5 rounded bg-brand-600/80 text-white">After</span>
      <input type="range" min={1} max={99} value={pos} onChange={(e) => setPos(+e.target.value)} className="absolute inset-x-0 bottom-2 mx-auto w-2/3 accent-brand-500" aria-label="Compare slider" />
    </div>
  )
}
