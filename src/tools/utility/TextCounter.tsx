import { useMemo, useState } from 'react'
import { Stat } from '@/components/ui'
import { Field } from '@/components/ui'

export default function TextCounter() {
  const [text, setText] = useState('')

  const stats = useMemo(() => {
    const chars = text.length
    const charsNoSpace = text.replace(/\s/g, '').length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const sentences = (text.match(/[.!?]+(\s|$)/g) || []).length
    const paragraphs = text.trim() ? text.trim().split(/\n{2,}/).filter(Boolean).length : 0
    const lines = text ? text.split('\n').length : 0
    const readingTime = Math.ceil(words / 200)
    const speakingTime = Math.ceil(words / 130)
    return { chars, charsNoSpace, words, sentences, paragraphs, lines, readingTime, speakingTime }
  }, [text])

  return (
    <div className="grid gap-5">
      <div className="card p-5">
        <Field label="Your text">
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="input h-56 resize-y" placeholder="Start typing or paste your text…" autoFocus />
        </Field>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <Stat label="Words" value={stats.words.toLocaleString()} />
        <Stat label="Characters" value={stats.chars.toLocaleString()} sub={`${stats.charsNoSpace.toLocaleString()} without spaces`} />
        <Stat label="Sentences" value={stats.sentences.toLocaleString()} />
        <Stat label="Paragraphs" value={stats.paragraphs.toLocaleString()} />
        <Stat label="Lines" value={stats.lines.toLocaleString()} />
        <Stat label="Reading time" value={`${stats.readingTime} min`} sub="~200 wpm" />
        <Stat label="Speaking time" value={`${stats.speakingTime} min`} sub="~130 wpm" />
        <Stat label="Avg word length" value={stats.words ? (stats.charsNoSpace / stats.words).toFixed(1) : '0'} />
      </div>
    </div>
  )
}
