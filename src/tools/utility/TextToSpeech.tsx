import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Volume2, VolumeX, Play, Pause, Download, Cpu, Zap, CheckCircle, Loader2, Globe } from 'lucide-react'
import { Field, Stat, Segmented } from '@/components/ui'
import { useToast } from '@/components/Toaster'
import { trackUsage } from '@/lib/storage'
import { getEdgeVoices, edgeTTSSynthesize, getLocales, type EdgeVoice } from '@/lib/edge-tts'

type Engine = 'browser' | 'kokoro' | 'edge'

interface VoiceInfo {
  name: string
  lang: string
  localService: boolean
  default: boolean
}

const KOKORO_VOICES = [
  { id: 'af_heart', label: 'Heart (American F)', gender: 'F', accent: 'American', grade: 'A' },
  { id: 'af_bella', label: 'Bella (American F)', gender: 'F', accent: 'American', grade: 'A-' },
  { id: 'af_nicole', label: 'Nicole (American F)', gender: 'F', accent: 'American', grade: 'B-' },
  { id: 'af_aoede', label: 'Aoede (American F)', gender: 'F', accent: 'American', grade: 'C+' },
  { id: 'af_kore', label: 'Kore (American F)', gender: 'F', accent: 'American', grade: 'C+' },
  { id: 'af_nova', label: 'Nova (American F)', gender: 'F', accent: 'American', grade: 'C' },
  { id: 'af_sarah', label: 'Sarah (American F)', gender: 'F', accent: 'American', grade: 'C' },
  { id: 'am_adam', label: 'Adam (American M)', gender: 'M', accent: 'American', grade: 'F+' },
  { id: 'am_fenrir', label: 'Fenrir (American M)', gender: 'M', accent: 'American', grade: 'C+' },
  { id: 'am_michael', label: 'Michael (American M)', gender: 'M', accent: 'American', grade: 'C+' },
  { id: 'am_puck', label: 'Puck (American M)', gender: 'M', accent: 'American', grade: 'C+' },
  { id: 'bf_emma', label: 'Emma (British F)', gender: 'F', accent: 'British', grade: 'B-' },
  { id: 'bf_isabella', label: 'Isabella (British F)', gender: 'F', accent: 'British', grade: 'C' },
  { id: 'bm_george', label: 'George (British M)', gender: 'M', accent: 'British', grade: 'C' },
  { id: 'bm_lewis', label: 'Lewis (British M)', gender: 'M', accent: 'British', grade: 'D+' },
]

const PRESET_TEXTS = [
  'Welcome to iLikePDF — the free, private, browser-based document toolkit. No uploads. No tracking. Everything runs locally in your browser.',
  'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.',
  'In the beginning was the Word, and the Word was with God, and the Word was God.',
  'To be, or not to be, that is the question: Whether \'tis nobler in the mind to suffer the slings and arrows of outrageous fortune.',
]

const KOKORO_MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX'

const POPULAR_EDGE_VOICES = [
  'en-US-JennyNeural', 'en-US-AriaNeural', 'en-US-GuyNeural', 'en-US-EmmaMultilingualNeural',
  'en-GB-SoniaNeural', 'en-GB-RyanNeural', 'fr-FR-DeniseNeural', 'de-DE-KatjaNeural',
  'es-ES-ElviraNeural', 'ja-JP-NanamiNeural', 'zh-CN-XiaoxiaoNeural', 'ko-KR-SunHiNeural',
  'pt-BR-FranciscaNeural', 'it-IT-ElsaNeural', 'ru-RU-SvetlanaNeural', 'ar-SA-ZariyahNeural',
]

export default function TextToSpeech() {
  const toast = useToast()
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Engine state
  const [engine, setEngine] = useState<Engine>('edge')

  // Text
  const [text, setText] = useState(PRESET_TEXTS[0])

  // Browser engine state
  const [browserVoices, setBrowserVoices] = useState<VoiceInfo[]>([])
  const [selectedBrowserVoice, setSelectedBrowserVoice] = useState('')
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [volume, setVolume] = useState(1)
  const [browserSupported, setBrowserSupported] = useState(true)
  const [highlightRange, setHighlightRange] = useState<[number, number] | null>(null)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const totalDurationRef = useRef(0)

  // Kokoro engine state
  const kokoroRef = useRef<any>(null)
  const [kokoroReady, setKokoroReady] = useState(false)
  const [kokoroLoading, setKokoroLoading] = useState(false)
  const [selectedKokoroVoice, setSelectedKokoroVoice] = useState('af_heart')
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const [kokoroDuration, setKokoroDuration] = useState(0)

  // Edge engine state
  const [edgeVoices, setEdgeVoices] = useState<EdgeVoice[]>([])
  const [selectedEdgeVoice, setSelectedEdgeVoice] = useState('en-US-JennyNeural')
  const [edgeLocale, setEdgeLocale] = useState('en-US')
  const [edgeLoading, setEdgeLoading] = useState(false)
  const [edgeReady, setEdgeReady] = useState(false)
  const edgeAudioRef = useRef<HTMLAudioElement | null>(null)
  const edgeBlobUrlRef = useRef<string | null>(null)

  // Shared state
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)

  // Load browser voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) { setBrowserSupported(false); return }
    synthRef.current = window.speechSynthesis

    const loadVoices = () => {
      const raw = synthRef.current!.getVoices()
      const mapped: VoiceInfo[] = raw.map(v => ({
        name: v.name, lang: v.lang, localService: v.localService, default: v.default,
      }))
      setBrowserVoices(mapped)
      if (!selectedBrowserVoice && mapped.length > 0) {
        const def = mapped.find(v => v.default)
        setSelectedBrowserVoice(def?.name ?? mapped[0].name)
      }
    }

    loadVoices()
    synthRef.current.onvoiceschanged = loadVoices
    return () => { synthRef.current?.cancel() }
  }, [])

  // Load Edge voices on mount
  useEffect(() => {
    getEdgeVoices().then(v => { setEdgeVoices(v); setEdgeReady(true) }).catch(() => {})
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      sourceRef.current?.stop()
      audioCtxRef.current?.close()
      if (edgeBlobUrlRef.current) URL.revokeObjectURL(edgeBlobUrlRef.current)
    }
  }, [])

  // ─── Browser Engine ──────────────────────────────────

  const getBrowserVoice = useCallback(() => {
    if (!synthRef.current) return null
    const all = synthRef.current.getVoices()
    return all.find(v => v.name === selectedBrowserVoice) ?? all[0] ?? null
  }, [selectedBrowserVoice])

  const stopBrowser = () => {
    synthRef.current?.cancel()
  }

  const speakBrowser = useCallback(() => {
    if (!synthRef.current || !text.trim()) return
    stopBrowser()
    setProgress(0)

    const u = new SpeechSynthesisUtterance(text)
    const voice = getBrowserVoice()
    if (voice) u.voice = voice
    u.rate = rate
    u.pitch = pitch
    u.volume = volume

    totalDurationRef.current = (text.length / (15 * rate)) * 1000
    startTimeRef.current = Date.now()

    u.onstart = () => {
      setSpeaking(true); setPaused(false)
      trackUsage({ toolId: 'text-to-speech', toolName: 'Text to Speech', action: `Browser: ${text.length} chars` })
    }
    u.onboundary = (e) => { if (e.name === 'word') setHighlightRange([e.charIndex, e.charIndex + e.charLength]) }
    u.onend = () => {
      setSpeaking(false); setPaused(false); setProgress(100); setHighlightRange(null)
      if (progressTimer.current) { clearInterval(progressTimer.current); progressTimer.current = null }
      setTimeout(() => setProgress(0), 800)
    }
    u.onerror = () => {
      setSpeaking(false); setPaused(false); setProgress(0)
      if (progressTimer.current) { clearInterval(progressTimer.current); progressTimer.current = null }
    }

    utterRef.current = u
    progressTimer.current = setInterval(() => {
      if (synthRef.current?.speaking && !synthRef.current?.paused) {
        const elapsed = Date.now() - startTimeRef.current
        setProgress(Math.min((elapsed / totalDurationRef.current) * 100, 99))
      }
    }, 50)

    synthRef.current.speak(u)
  }, [text, rate, pitch, volume, getBrowserVoice])

  // ─── Kokoro Engine ───────────────────────────────────

  const loadKokoro = async () => {
    if (kokoroReady || kokoroLoading) return
    setKokoroLoading(true)
    try {
      const { KokoroTTS } = await import('kokoro-js')
      const device = 'gpu' in navigator ? 'webgpu' : 'wasm'
      toast.info(`Loading Kokoro model (${device.toUpperCase()})...`)
      const tts = await KokoroTTS.from_pretrained(KOKORO_MODEL_ID, { dtype: 'q8', device } as any)
      kokoroRef.current = tts
      setKokoroReady(true)
      toast.success('Kokoro model ready!')
      trackUsage({ toolId: 'text-to-speech', toolName: 'Text to Speech', action: `Loaded Kokoro (${device})` })
    } catch (err) {
      console.error('Failed to load Kokoro:', err)
      toast.error('Failed to load Kokoro model.')
    } finally { setKokoroLoading(false) }
  }

  const stopKokoro = () => {
    sourceRef.current?.stop(); sourceRef.current = null
  }

  const speakKokoro = useCallback(async () => {
    if (!kokoroRef.current || !text.trim()) return
    stopKokoro(); setProgress(0)
    try {
      setSpeaking(true); startTimeRef.current = Date.now()
      const audio = await kokoroRef.current.generate(text, { voice: selectedKokoroVoice })
      const audioData = audio.audioData ?? audio._audioData
      const sampleRate = audio.sampleRate ?? 24000
      if (!audioData) { toast.error('Generation failed.'); setSpeaking(false); return }

      const ctx = new AudioContext({ sampleRate }); audioCtxRef.current = ctx
      const buffer = ctx.createBuffer(1, audioData.length, sampleRate)
      buffer.getChannelData(0).set(audioData)
      const source = ctx.createBufferSource(); source.buffer = buffer; source.connect(ctx.destination)
      sourceRef.current = source
      const durationMs = buffer.duration * 1000; totalDurationRef.current = durationMs; setKokoroDuration(buffer.duration)

      progressTimer.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current
        setProgress(Math.min((elapsed / durationMs) * 100, 99))
      }, 50)

      source.onended = () => {
        setSpeaking(false); setPaused(false); setProgress(100)
        if (progressTimer.current) { clearInterval(progressTimer.current); progressTimer.current = null }
        setTimeout(() => setProgress(0), 800)
      }
      source.start(0)
      trackUsage({ toolId: 'text-to-speech', toolName: 'Text to Speech', action: `Kokoro: ${text.length} chars` })
    } catch { toast.error('Generation failed.'); setSpeaking(false); setProgress(0) }
  }, [text, selectedKokoroVoice])

  // ─── Edge Engine ─────────────────────────────────────

  const stopEdge = () => {
    if (edgeAudioRef.current) { edgeAudioRef.current.pause(); edgeAudioRef.current.currentTime = 0 }
  }

  const speakEdge = useCallback(async () => {
    if (!text.trim() || !selectedEdgeVoice) return
    stopEdge(); setProgress(0)

    try {
      setSpeaking(true); startTimeRef.current = Date.now()
      const ratePercent = Math.round((rate - 1) * 100)
      const pitchHz = Math.round((pitch - 1) * 50)
      const volumePercent = Math.round((volume - 0.5) * 200)

      toast.info('Generating neural speech...')
      const blob = await edgeTTSSynthesize(text, selectedEdgeVoice, {
        rate: ratePercent, pitch: pitchHz, volume: volumePercent,
      })

      if (edgeBlobUrlRef.current) URL.revokeObjectURL(edgeBlobUrlRef.current)
      const url = URL.createObjectURL(blob)
      edgeBlobUrlRef.current = url

      const audio = new Audio(url)
      edgeAudioRef.current = audio

      audio.ontimeupdate = () => {
        if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
      }
      audio.onended = () => {
        setSpeaking(false); setPaused(false); setProgress(100)
        setTimeout(() => setProgress(0), 800)
      }
      audio.onerror = () => { setSpeaking(false); setProgress(0); toast.error('Playback failed.') }

      await audio.play()
      trackUsage({ toolId: 'text-to-speech', toolName: 'Text to Speech', action: `Edge: ${text.length} chars with ${selectedEdgeVoice}` })
    } catch (err) {
      console.error('Edge TTS failed:', err)
      toast.error('Edge TTS failed. Check your connection.')
      setSpeaking(false); setProgress(0)
    }
  }, [text, selectedEdgeVoice, rate, pitch, volume])

  const pauseEdge = () => { if (edgeAudioRef.current) { edgeAudioRef.current.pause(); setPaused(true) } }
  const resumeEdge = () => { if (edgeAudioRef.current) { edgeAudioRef.current.play(); setPaused(false) } }

  // ─── Shared Controls ─────────────────────────────────

  const stopAll = () => {
    if (engine === 'browser') stopBrowser()
    else if (engine === 'kokoro') stopKokoro()
    else stopEdge()
    setSpeaking(false); setPaused(false); setProgress(0)
    if (progressTimer.current) { clearInterval(progressTimer.current); progressTimer.current = null }
  }

  const speak = () => {
    if (engine === 'browser') speakBrowser()
    else if (engine === 'kokoro') speakKokoro()
    else speakEdge()
  }

  const pause = () => {
    if (engine === 'browser' && synthRef.current?.speaking) { synthRef.current.pause(); setPaused(true) }
    else if (engine === 'kokoro' && audioCtxRef.current?.state === 'running') { audioCtxRef.current.suspend(); setPaused(true) }
    else if (engine === 'edge') pauseEdge()
  }

  const resume = () => {
    if (engine === 'browser' && synthRef.current?.paused) { synthRef.current.resume(); setPaused(false) }
    else if (engine === 'kokoro' && audioCtxRef.current?.state === 'suspended') { audioCtxRef.current.resume(); setPaused(false) }
    else if (engine === 'edge') resumeEdge()
  }

  const downloadAudio = async () => {
    if (!text.trim()) return
    if (engine === 'browser') {
      toast.info('Recording audio...')
      try {
        const ctx = new AudioContext()
        const dest = ctx.createMediaStreamDestination()
        const recorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm' })
        const chunks: BlobPart[] = []
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' })
          const url = URL.createObjectURL(blob); const a = document.createElement('a')
          a.href = url; a.download = 'speech.webm'; a.click(); URL.revokeObjectURL(url)
          toast.success('Audio downloaded!')
        }
        const u = new SpeechSynthesisUtterance(text)
        const voice = getBrowserVoice(); if (voice) u.voice = voice; u.rate = rate; u.pitch = pitch; u.volume = 1
        u.onend = () => setTimeout(() => recorder.stop(), 200)
        recorder.start(); synthRef.current?.speak(u)
      } catch { toast.error('Recording not supported.') }
    } else if (engine === 'kokoro' && kokoroRef.current) {
      try {
        const audio = await kokoroRef.current.generate(text, { voice: selectedKokoroVoice })
        const audioData = audio.audioData ?? audio._audioData; const sampleRate = audio.sampleRate ?? 24000
        if (!audioData) return
        const wav = encodeWav(audioData, sampleRate)
        const blob = new Blob([wav], { type: 'audio/wav' })
        const url = URL.createObjectURL(blob); const a = document.createElement('a')
        a.href = url; a.download = `kokoro-${selectedKokoroVoice}.wav`; a.click(); URL.revokeObjectURL(url)
        toast.success('WAV downloaded!')
      } catch { toast.error('Download failed.') }
    } else if (engine === 'edge') {
      try {
        const ratePercent = Math.round((rate - 1) * 100)
        const pitchHz = Math.round((pitch - 1) * 50)
        const volumePercent = Math.round((volume - 0.5) * 200)
        const blob = await edgeTTSSynthesize(text, selectedEdgeVoice, { rate: ratePercent, pitch: pitchHz, volume: volumePercent })
        const url = URL.createObjectURL(blob); const a = document.createElement('a')
        a.href = url; a.download = `${selectedEdgeVoice}.mp3`; a.click(); URL.revokeObjectURL(url)
        toast.success('MP3 downloaded!')
      } catch { toast.error('Download failed.') }
    }
  }

  // ─── Computed ────────────────────────────────────────

  const charCount = text.length
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const estDuration = engine === 'kokoro' && kokoroDuration > 0
    ? `${kokoroDuration.toFixed(1)}s`
    : `${Math.ceil((wordCount / (150 * rate)) * 60)}s`

  const browserVoicesByLang = browserVoices.reduce<Record<string, VoiceInfo[]>>((acc, v) => {
    const langCode = v.lang.split('-')[0]; (acc[langCode] ??= []).push(v); return acc
  }, {})

  const edgeLocales = getLocales(edgeVoices)
  const edgeVoicesForLocale = edgeVoices.filter(v => v.Locale === edgeLocale)

  // ─── Word Highlighting ───────────────────────────────

  const [kokoroHighlight, setKokoroHighlight] = useState<number | null>(null)
  useEffect(() => {
    if ((engine !== 'kokoro' && engine !== 'edge') || !speaking || !text.trim()) { setKokoroHighlight(null); return }
    const words = text.split(/\s+/)
    const totalMs = totalDurationRef.current
    if (totalMs <= 0) return
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const pct = elapsed / totalMs
      setKokoroHighlight(Math.min(Math.floor(pct * words.length), words.length - 1))
    }, 80)
    return () => clearInterval(timer)
  }, [engine, speaking, text])

  const renderHighlightedText = () => {
    if (engine === 'browser' && highlightRange) {
      return (
        <>
          <span className="text-ink-700 dark:text-ink-300">{text.slice(0, highlightRange[0])}</span>
          <span className="bg-brand-500/20 text-brand-700 dark:text-brand-300 rounded px-0.5 font-medium">{text.slice(highlightRange[0], highlightRange[0] + highlightRange[1])}</span>
          <span className="text-ink-700 dark:text-ink-300">{text.slice(highlightRange[0] + highlightRange[1])}</span>
        </>
      )
    }

    if ((engine === 'kokoro' || engine === 'edge') && kokoroHighlight !== null && speaking) {
      const words = text.split(/(\s+)/)
      let wordCount = 0
      const actualWordIdx = Math.floor(kokoroHighlight / 2)
      return (
        <>
          {words.map((word, i) => {
            if (/^\s+$/.test(word)) return <span key={i} className="text-ink-700 dark:text-ink-300">{word}</span>
            const idx = wordCount++
            return (
              <span key={i} className={idx === actualWordIdx ? 'bg-brand-500/20 text-brand-700 dark:text-brand-300 rounded px-0.5 font-medium' : 'text-ink-700 dark:text-ink-300'}>
                {word}
              </span>
            )
          })}
        </>
      )
    }

    return <span className="text-ink-400 italic">Press Play to hear your text</span>
  }

  // ─── Render ──────────────────────────────────────────

  const playDisabled = !text.trim() ||
    (engine === 'browser' && !browserSupported) ||
    (engine === 'kokoro' && !kokoroReady) ||
    (engine === 'edge' && !edgeReady)

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="card p-5 grid gap-4">
        {/* Engine selector */}
        <Field label="TTS Engine">
          <Segmented value={engine} onChange={v => setEngine(v as Engine)} options={[
            { value: 'browser', label: 'Browser' },
            { value: 'kokoro', label: 'Kokoro AI' },
            { value: 'edge', label: 'Edge Neural' },
          ]} />
        </Field>

        {/* Engine status badges */}
        {engine === 'kokoro' && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800/40">
            {kokoroReady ? (
              <><CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" /><div className="flex-1 min-w-0"><p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Kokoro ready</p><p className="text-xs text-ink-500">82M params · cached locally</p></div></>
            ) : kokoroLoading ? (
              <><Loader2 className="h-5 w-5 text-brand-500 shrink-0 animate-spin" /><div className="flex-1 min-w-0"><p className="text-sm font-medium">Loading Kokoro...</p><p className="text-xs text-ink-500">Downloads ~82MB once</p></div></>
            ) : (
              <><Cpu className="h-5 w-5 text-ink-400 shrink-0" /><div className="flex-1 min-w-0"><p className="text-sm font-medium">Neural model not loaded</p><p className="text-xs text-ink-500">Downloads ~82MB once, then cached</p></div>
                <button onClick={loadKokoro} className="btn-primary btn-sm shrink-0"><Download className="h-4 w-4" /> Download</button></>
            )}
          </div>
        )}

        {engine === 'edge' && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800/40">
            {edgeReady ? (
              <><Globe className="h-5 w-5 text-blue-500 shrink-0" /><div className="flex-1 min-w-0"><p className="text-sm font-medium text-blue-600 dark:text-blue-400">Edge Neural ready</p><p className="text-xs text-ink-500">{edgeVoices.length} voices · no download needed</p></div></>
            ) : (
              <><Loader2 className="h-5 w-5 text-blue-500 shrink-0 animate-spin" /><div className="flex-1 min-w-0"><p className="text-sm font-medium">Loading voices...</p></div></>
            )}
          </div>
        )}

        {/* Text input */}
        <Field label="Text to speak">
          <textarea value={text} onChange={e => setText(e.target.value)} className="input min-h-[140px] resize-y" placeholder="Type or paste text here..." />
        </Field>

        <div className="flex gap-2 flex-wrap">
          {PRESET_TEXTS.map((p, i) => (
            <button key={i} onClick={() => setText(p)} className="btn-ghost btn-sm text-xs">{`Preset ${i + 1}`}</button>
          ))}
        </div>

        {/* Voice selector — Browser */}
        {engine === 'browser' && (
          <Field label="Voice">
            <select value={selectedBrowserVoice} onChange={e => setSelectedBrowserVoice(e.target.value)} className="input">
              {browserVoices.length === 0 && <option>Loading voices...</option>}
              {Object.entries(browserVoicesByLang).sort(([a], [b]) => a.localeCompare(b)).map(([lang, vs]) => (
                <optgroup key={lang} label={lang.toUpperCase()}>
                  {vs.map(v => <option key={v.name} value={v.name}>{v.name} {v.localService ? '(local)' : '(network)'}</option>)}
                </optgroup>
              ))}
            </select>
          </Field>
        )}

        {/* Voice selector — Kokoro */}
        {engine === 'kokoro' && (
          <Field label="Neural voice">
            <select value={selectedKokoroVoice} onChange={e => setSelectedKokoroVoice(e.target.value)} className="input" disabled={!kokoroReady}>
              {KOKORO_VOICES.map(v => <option key={v.id} value={v.id}>{v.label} — Grade {v.grade}</option>)}
            </select>
          </Field>
        )}

        {/* Voice selector — Edge */}
        {engine === 'edge' && (
          <>
            <Field label="Language">
              <select value={edgeLocale} onChange={e => { setEdgeLocale(e.target.value); const first = edgeVoices.find(v => v.Locale === e.target.value); if (first) setSelectedEdgeVoice(first.ShortName) }} className="input">
                {edgeLocales.map(l => {
                  const sample = edgeVoices.find(v => v.Locale === l)
                  return <option key={l} value={l}>{sample?.LocalName ?? l} ({l})</option>
                })}
              </select>
            </Field>
            <Field label="Voice">
              <select value={selectedEdgeVoice} onChange={e => setSelectedEdgeVoice(e.target.value)} className="input">
                {POPULAR_EDGE_VOICES.filter(v => edgeVoices.some(ev => ev.ShortName === v)).length > 0 && (
                  <optgroup label="Popular">
                    {POPULAR_EDGE_VOICES.filter(v => edgeVoices.some(ev => ev.ShortName === v)).map(v => {
                      const ev = edgeVoices.find(e => e.ShortName === v)
                      return <option key={v} value={v}>{ev?.LocalName ?? v} ({ev?.Gender})</option>
                    })}
                  </optgroup>
                )}
                <optgroup label={edgeLocale}>
                  {edgeVoicesForLocale.map(v => <option key={v.ShortName} value={v.ShortName}>{v.LocalName} ({v.Gender})</option>)}
                </optgroup>
              </select>
            </Field>
          </>
        )}

        {/* Rate (all engines) */}
        <Field label={`Rate: ${rate.toFixed(1)}x`}>
          <input type="range" min={0.25} max={3} step={0.25} value={rate} onChange={e => setRate(+e.target.value)} className="w-full accent-brand-500" />
        </Field>

        {/* Pitch + Volume (browser & edge only) */}
        {engine !== 'kokoro' && (
          <div className="grid grid-cols-2 gap-4">
            <Field label={`Pitch: ${pitch.toFixed(1)}`}>
              <input type="range" min={0} max={2} step={0.1} value={pitch} onChange={e => setPitch(+e.target.value)} className="w-full accent-brand-500" />
            </Field>
            <Field label={`Volume: ${Math.round(volume * 100)}%`}>
              <input type="range" min={0} max={1} step={0.05} value={volume} onChange={e => setVolume(+e.target.value)} className="w-full accent-brand-500" />
            </Field>
          </div>
        )}

        {engine === 'browser' && !browserSupported && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm">TTS not supported in this browser.</div>
        )}
        {engine === 'kokoro' && !kokoroReady && !kokoroLoading && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm">Download the Kokoro model first.</div>
        )}

        {/* Controls */}
        <div className="flex gap-2 flex-wrap">
          {!speaking ? (
            <button onClick={speak} disabled={playDisabled} className="btn-primary btn-sm"><Play className="h-4 w-4" /> Play</button>
          ) : paused ? (
            <button onClick={resume} className="btn-primary btn-sm"><Play className="h-4 w-4" /> Resume</button>
          ) : (
            <button onClick={pause} className="btn-primary btn-sm"><Pause className="h-4 w-4" /> Pause</button>
          )}
          <button onClick={stopAll} disabled={!speaking && !paused} className="btn-ghost btn-sm"><VolumeX className="h-4 w-4" /> Stop</button>
          <button onClick={downloadAudio} disabled={playDisabled} className="btn-secondary btn-sm"><Download className="h-4 w-4" /> Save</button>
        </div>
      </div>

      {/* Right panel */}
      <div className="card p-5 grid gap-4">
        <div className="flex items-center gap-3 mb-2">
          {engine === 'browser' ? <Volume2 className="h-5 w-5 text-brand-500" /> : engine === 'kokoro' ? <Zap className="h-5 w-5 text-brand-500" /> : <Globe className="h-5 w-5 text-blue-500" />}
          <h3 className="text-sm font-semibold">
            {engine === 'browser' ? 'Browser TTS' : engine === 'kokoro' ? 'Kokoro Neural' : 'Edge Neural'}
          </h3>
          {engine === 'kokoro' && kokoroReady && <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">AI</span>}
          {engine === 'edge' && edgeReady && <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">Neural</span>}
        </div>

        <div className="rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800/40 p-5 min-h-[160px] text-lg leading-relaxed">
          {renderHighlightedText()}
        </div>

        {speaking || progress > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
            <div className="w-full h-2 rounded-full bg-ink-200 dark:bg-ink-700 overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500" animate={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
            </div>
            <p className="text-xs text-ink-500 mt-1 text-center">{Math.round(progress)}%</p>
          </motion.div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Characters" value={charCount.toLocaleString()} />
          <Stat label="Words" value={wordCount.toLocaleString()} />
          <Stat label="Est. duration" value={estDuration} />
          <Stat label="Voice" value={
            engine === 'browser' ? selectedBrowserVoice.split(' ').slice(0, 2).join(' ') :
            engine === 'kokoro' ? KOKORO_VOICES.find(v => v.id === selectedKokoroVoice)?.label.split(' ')[0] ?? '' :
            edgeVoices.find(v => v.ShortName === selectedEdgeVoice)?.LocalName ?? ''
          } />
        </div>

        {engine === 'kokoro' && (
          <div className="p-3 rounded-xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200 dark:border-ink-700">
            <p className="text-xs text-ink-500">Kokoro-82M · Apache 2.0 · {KOKORO_VOICES.length} voices · 100% in-browser</p>
          </div>
        )}
        {engine === 'edge' && (
          <div className="p-3 rounded-xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200 dark:border-ink-700">
            <p className="text-xs text-ink-500">Microsoft Edge Neural · {edgeVoices.length} voices · {edgeLocales.length} languages · No API key</p>
          </div>
        )}
        {engine === 'browser' && browserVoices.length > 0 && (
          <div className="p-3 rounded-xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200 dark:border-ink-700">
            <p className="text-xs text-ink-500">{browserVoices.length} voices · {browserVoices.filter(v => v.localService).length} local · {browserVoices.filter(v => !v.localService).length} network</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── WAV Encoder ────────────────────────────────────────

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1, bitsPerSample = 16
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8)
  const blockAlign = numChannels * (bitsPerSample / 8)
  const dataSize = samples.length * (bitsPerSample / 8)
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    offset += 2
  }
  return buffer
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
}
