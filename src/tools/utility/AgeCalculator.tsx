import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Field, Stat, Progress } from '@/components/ui'
import { trackUsage } from '@/lib/storage'
import {
  Copy, Share2, Check, Cake, Clock, Globe, Milestone,
  Star, Compass, Sparkles, Zap, Target, Crown, Gem,
  Hash, Calendar, Hourglass, Timer, Activity,
  Orbit, Gauge, Scale, Hexagon, Triangle, Circle,
  Flame, Droplets, Mountain, Leaf, Fish, Bug,
  TreePine, Bird, Cat, Rabbit, Dog, Heart,
  Shield, Compass as CompassIcon, RotateCcw,
  Briefcase, Bed, Users, Sunrise,
} from 'lucide-react'

const ZODIAC_SIGNS = [
  { name: 'Capricorn', dates: 'Dec 22 – Jan 19', icon: Mountain, element: 'Earth' },
  { name: 'Aquarius', dates: 'Jan 20 – Feb 18', icon: Droplets, element: 'Air' },
  { name: 'Pisces', dates: 'Feb 19 – Mar 20', icon: Fish, element: 'Water' },
  { name: 'Aries', dates: 'Mar 21 – Apr 19', icon: Flame, element: 'Fire' },
  { name: 'Taurus', dates: 'Apr 20 – May 20', icon: Leaf, element: 'Earth' },
  { name: 'Gemini', dates: 'May 21 – Jun 20', icon: Heart, element: 'Air' },
  { name: 'Cancer', dates: 'Jun 21 – Jul 22', icon: Shield, element: 'Water' },
  { name: 'Leo', dates: 'Jul 23 – Aug 22', icon: Crown, element: 'Fire' },
  { name: 'Virgo', dates: 'Aug 23 – Sep 22', icon: Sparkles, element: 'Earth' },
  { name: 'Libra', dates: 'Sep 23 – Oct 22', icon: Scale, element: 'Air' },
  { name: 'Scorpio', dates: 'Oct 23 – Nov 21', icon: Bug, element: 'Water' },
  { name: 'Sagittarius', dates: 'Nov 22 – Dec 21', icon: Target, element: 'Fire' },
] as const

const CHINESE_ZODIAC = [
  { animal: 'Rat', years: '2020, 2008, 1996, 1984', icon: Zap },
  { animal: 'Ox', years: '2021, 2009, 1997, 1985', icon: Compass },
  { animal: 'Tiger', years: '2022, 2010, 1998, 1986', icon: Cat },
  { animal: 'Rabbit', years: '2023, 2011, 1999, 1987', icon: Rabbit },
  { animal: 'Dragon', years: '2024, 2012, 2000, 1988', icon: Flame },
  { animal: 'Snake', years: '2025, 2013, 2001, 1989', icon: RotateCcw },
  { animal: 'Horse', years: '2026, 2014, 2002, 1990', icon: CompassIcon },
  { animal: 'Goat', years: '2027, 2015, 2003, 1991', icon: TreePine },
  { animal: 'Monkey', years: '2028, 2016, 2004, 1992', icon: Bird },
  { animal: 'Rooster', years: '2029, 2017, 2005, 1993', icon: Sparkles },
  { animal: 'Dog', years: '2030, 2018, 2006, 1994', icon: Dog },
  { animal: 'Pig', years: '2031, 2019, 2007, 1995', icon: Gem },
] as const

const PLANET_AGES = [
  { planet: 'Mercury', ratio: 0.2408467, Icon: Compass, color: 'text-slate-400' },
  { planet: 'Venus', ratio: 0.61519726, Icon: Heart, color: 'text-amber-400' },
  { planet: 'Earth', ratio: 1.0, Icon: Globe, color: 'text-emerald-400' },
  { planet: 'Mars', ratio: 1.8808158, Icon: Flame, color: 'text-red-400' },
  { planet: 'Jupiter', ratio: 11.862615, Icon: Circle, color: 'text-orange-400' },
  { planet: 'Saturn', ratio: 29.447498, Icon: Hexagon, color: 'text-yellow-400' },
  { planet: 'Uranus', ratio: 84.016846, Icon: Triangle, color: 'text-cyan-400' },
  { planet: 'Neptune', ratio: 164.79132, Icon: Orbit, color: 'text-blue-400' },
] as const

const COMPATIBILITY: Record<string, { best: string[]; good: string[]; challenging: string[]; traits: string }> = {
  Aries: { best: ['Leo', 'Sagittarius'], good: ['Gemini', 'Aquarius'], challenging: ['Cancer', 'Capricorn'], traits: 'Passionate, energetic, impulsive' },
  Taurus: { best: ['Virgo', 'Capricorn'], good: ['Cancer', 'Pisces'], challenging: ['Leo', 'Aquarius'], traits: 'Reliable, patient, stubborn' },
  Gemini: { best: ['Libra', 'Aquarius'], good: ['Aries', 'Leo'], challenging: ['Virgo', 'Pisces'], traits: 'Curious, social, inconsistent' },
  Cancer: { best: ['Scorpio', 'Pisces'], good: ['Taurus', 'Virgo'], challenging: ['Aries', 'Libra'], traits: 'Nurturing, intuitive, moody' },
  Leo: { best: ['Aries', 'Sagittarius'], good: ['Gemini', 'Libra'], challenging: ['Taurus', 'Scorpio'], traits: 'Confident, creative, dramatic' },
  Virgo: { best: ['Taurus', 'Capricorn'], good: ['Cancer', 'Scorpio'], challenging: ['Gemini', 'Sagittarius'], traits: 'Analytical, practical, critical' },
  Libra: { best: ['Gemini', 'Aquarius'], good: ['Leo', 'Sagittarius'], challenging: ['Cancer', 'Capricorn'], traits: 'Diplomatic, fair, indecisive' },
  Scorpio: { best: ['Cancer', 'Pisces'], good: ['Virgo', 'Capricorn'], challenging: ['Leo', 'Aquarius'], traits: 'Intense, passionate, secretive' },
  Sagittarius: { best: ['Aries', 'Leo'], good: ['Libra', 'Aquarius'], challenging: ['Virgo', 'Pisces'], traits: 'Adventurous, optimistic, careless' },
  Capricorn: { best: ['Taurus', 'Virgo'], good: ['Scorpio', 'Pisces'], challenging: ['Aries', 'Libra'], traits: 'Ambitious, disciplined, reserved' },
  Aquarius: { best: ['Gemini', 'Libra'], good: ['Aries', 'Sagittarius'], challenging: ['Taurus', 'Scorpio'], traits: 'Independent, innovative, detached' },
  Pisces: { best: ['Cancer', 'Scorpio'], good: ['Taurus', 'Capricorn'], challenging: ['Gemini', 'Sagittarius'], traits: 'Compassionate, artistic, escapist' },
}

function calculateAge(birth: Date, now: Date) {
  const ms = now.getTime() - birth.getTime()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  let days = now.getDate() - birth.getDate()
  if (days < 0) {
    months--
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate()
  }
  if (months < 0) {
    years--
    months += 12
  }

  const totalDays = Math.floor(ms / 86400000)
  const totalWeeks = Math.floor(totalDays / 7)
  const totalHours = Math.floor(ms / 3600000)
  const totalMinutes = Math.floor(ms / 60000)

  const dayOfWeek = birth.toLocaleDateString('en-US', { weekday: 'long' })
  const dayOfWeekShort = birth.toLocaleDateString('en-US', { weekday: 'short' })
  const birthDayOfWeek = birth.getDay()
  const startOfYear = new Date(birth.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((ms - startOfYear.getTime()) / 86400000)
  const daysLeftInYear = Math.max(0, Math.floor((new Date(birth.getFullYear() + 1, 0, 1).getTime() - now.getTime()) / 86400000))

  const bd = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
  if (bd <= now) bd.setFullYear(bd.getFullYear() + 1)
  const nextBdMs = bd.getTime() - now.getTime()
  const nextBdDays = Math.ceil(nextBdMs / 86400000)
  const nextBdWeekday = bd.toLocaleDateString('en-US', { weekday: 'long' })

  const hb = new Date(birth.getFullYear() + years, birth.getMonth() + 6, birth.getDate())
  const halfBdDays = Math.max(0, Math.ceil((hb.getTime() - now.getTime()) / 86400000))

  const monthDay = (now.getMonth() + 1) * 100 + now.getDate()
  let zodiacIdx: number
  if (monthDay <= 119) zodiacIdx = 0
  else if (monthDay <= 218) zodiacIdx = 1
  else if (monthDay <= 320) zodiacIdx = 2
  else if (monthDay <= 419) zodiacIdx = 3
  else if (monthDay <= 520) zodiacIdx = 4
  else if (monthDay <= 620) zodiacIdx = 5
  else if (monthDay <= 722) zodiacIdx = 6
  else if (monthDay <= 822) zodiacIdx = 7
  else if (monthDay <= 922) zodiacIdx = 8
  else if (monthDay <= 1022) zodiacIdx = 9
  else if (monthDay <= 1121) zodiacIdx = 10
  else zodiacIdx = 11

  const chineseIdx = (now.getFullYear() - 1900) % 12
  const lifeProgress = Math.min(100, (totalDays / 28000) * 100)

  const workdays = Math.floor(totalDays * 5 / 7) + (totalDays % 7 <= birthDayOfWeek ? 0 : Math.min(totalDays % 7, 5 - birthDayOfWeek))
  const weekends = totalDays - workdays

  const estimatedHeartbeats = Math.floor(totalMinutes * 72)
  const estimatedSleepHours = Math.floor(totalHours / 3)

  const milestones = [
    { name: 'Sweet 16', Icon: Sparkles, date: new Date(birth.getFullYear() + 16, birth.getMonth(), birth.getDate()) },
    { name: '18th Birthday', Icon: Star, date: new Date(birth.getFullYear() + 18, birth.getMonth(), birth.getDate()) },
    { name: '21st Birthday', Icon: Cake, date: new Date(birth.getFullYear() + 21, birth.getMonth(), birth.getDate()) },
    { name: '30th Birthday', Icon: Cake, date: new Date(birth.getFullYear() + 30, birth.getMonth(), birth.getDate()) },
    { name: 'Half Century', Icon: Crown, date: new Date(birth.getFullYear() + 50, birth.getMonth(), birth.getDate()) },
    { name: 'Diamond Jubilee', Icon: Gem, date: new Date(birth.getFullYear() + 60, birth.getMonth(), birth.getDate()) },
    { name: '10,000 Days', Icon: Target, date: new Date(birth.getTime() + 10000 * 86400000) },
  ]
    .map(m => ({ ...m, daysAway: Math.ceil((m.date.getTime() - now.getTime()) / 86400000) }))
    .filter(m => m.daysAway > 0)

  const planetAges = PLANET_AGES.map(p => ({
    planet: p.planet,
    age: Math.floor(totalDays / 365.25 / p.ratio),
    Icon: p.Icon,
    color: p.color,
  }))

  return {
    years, months, days, totalDays, totalWeeks, totalHours, totalMinutes,
    dayOfWeek, dayOfWeekShort, birthDayOfWeek, zodiac: ZODIAC_SIGNS[zodiacIdx], chineseZodiac: CHINESE_ZODIAC[chineseIdx],
    nextBirthday: { daysAway: nextBdDays, weekday: nextBdWeekday, targetDate: bd },
    dayOfYear, daysLeftInYear,
    halfBirthdayDays: halfBdDays,
    lifeProgress, milestones, planetAges,
    workdays, weekends, estimatedHeartbeats, estimatedSleepHours,
  }
}

type AgeResult = ReturnType<typeof calculateAge>

function getCompatibility(a: string, b: string) {
  const data = COMPATIBILITY[a]
  if (!data) return { level: 'Unknown', color: 'text-ink-400', score: 50, description: '' }
  if (data.best.includes(b)) return { level: 'Excellent', color: 'text-emerald-500', score: 95, description: 'A natural match! You complement each other perfectly.' }
  if (data.good.includes(b)) return { level: 'Good', color: 'text-sky-500', score: 75, description: 'A strong connection with room to grow together.' }
  if (a === b) return { level: 'Same Sign', color: 'text-accent-500', score: 80, description: 'You share the same strengths and challenges.' }
  return { level: 'Challenging', color: 'text-amber-500', score: 45, description: 'Different styles, but differences can spark growth.' }
}

function AnimatedNumber({ value, label }: { value: number; label: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const duration = 1200
    const startTime = Date.now()
    let raf: number
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setDisplay(Math.floor((1 - Math.pow(1 - progress, 3)) * value))
      if (progress < 1) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center p-4 rounded-2xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200 dark:border-ink-700"
    >
      <p className="text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-500 font-medium">{label}</p>
      <p className="text-3xl font-bold mt-1 gradient-text tabular-nums">{display.toLocaleString()}</p>
    </motion.div>
  )
}

function LiveCountdown({ targetDate }: { targetDate: Date }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const diff = Math.max(0, targetDate.getTime() - now)
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  const segments = [
    { value: hours, label: 'HRS' },
    { value: minutes, label: 'MIN' },
    { value: seconds, label: 'SEC' },
  ]

  return (
    <div className="flex items-center justify-center gap-3">
      {segments.map((s, i) => (
        <div key={s.label} className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums gradient-text">{String(s.value).padStart(2, '0')}</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-500 font-medium">{s.label}</p>
          </div>
          {i < segments.length - 1 && <span className="text-2xl font-bold text-ink-300 dark:text-ink-600">:</span>}
        </div>
      ))}
    </div>
  )
}

function DayOfWeekCalendar({ birthDayOfWeek }: { birthDayOfWeek: number }) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return (
    <div className="flex gap-1.5">
      {dayNames.map((d, i) => (
        <div
          key={d}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-medium transition-colors ${
            i === birthDayOfWeek
              ? 'bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-sm'
              : 'bg-ink-100 dark:bg-ink-800 text-ink-400 dark:text-ink-500'
          }`}
        >
          {d}
        </div>
      ))}
    </div>
  )
}

export default function AgeCalculator() {
  const [birthDate, setBirthDate] = useState('')
  const [result, setResult] = useState<AgeResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [compatSign, setCompatSign] = useState<string | null>(null)

  const handleCalculate = useCallback(() => {
    if (!birthDate) return
    const birth = new Date(birthDate)
    const now = new Date()
    if (isNaN(birth.getTime()) || birth > now) return
    setResult(calculateAge(birth, now))
    setCompatSign(null)
    trackUsage({ toolId: 'age-calculator', toolName: 'Age Calculator', action: 'Calculated age' })
  }, [birthDate])

  const handleCopy = useCallback(() => {
    if (!result) return
    const text = [
      `Age: ${result.years} years, ${result.months} months, ${result.days} days`,
      `Total: ${result.totalDays.toLocaleString()} days`,
      `Zodiac: ${result.zodiac.name}`,
      `Chinese Zodiac: ${result.chineseZodiac.animal}`,
      `Born on a: ${result.dayOfWeek}`,
      `Next Birthday: ${result.nextBirthday.daysAway} days (${result.nextBirthday.weekday})`,
    ].join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [result])

  const handleShare = useCallback(() => {
    if (!result) return
    const text = `I am ${result.years} years, ${result.months} months, and ${result.days} days old!`
    if (navigator.share) {
      navigator.share({ title: 'My Age', text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => setCopied(true))
      setTimeout(() => setCopied(false), 2000)
    }
  }, [result])

  const now = new Date()
  const maxDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const compat = result && compatSign ? getCompatibility(result.zodiac.name, compatSign) : null

  return (
    <div className="grid gap-5">
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1 min-w-0">
            <Field label="Date of Birth">
              <input
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                max={maxDate}
                className="input w-full"
              />
            </Field>
          </div>
          <button
            onClick={handleCalculate}
            disabled={!birthDate}
            className="btn-primary btn-md whitespace-nowrap"
          >
            Calculate Age
          </button>
        </div>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-5"
        >
          <div className="flex gap-2">
            <button onClick={handleCopy} className="btn-ghost btn-sm">
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={handleShare} className="btn-ghost btn-sm">
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <AnimatedNumber value={result.years} label="Years" />
            <AnimatedNumber value={result.months} label="Months" />
            <AnimatedNumber value={result.days} label="Days" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Total Days" value={result.totalDays.toLocaleString()} />
            <Stat label="Total Weeks" value={result.totalWeeks.toLocaleString()} />
            <Stat label="Total Hours" value={result.totalHours.toLocaleString()} />
            <Stat label="Total Minutes" value={result.totalMinutes.toLocaleString()} />
          </div>

          {/* Live Birthday Countdown */}
          <div className="p-4 rounded-2xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200 dark:border-ink-700">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100 mb-3 flex items-center gap-2">
              <Timer className="w-4 h-4 text-accent-500" />
              Next Birthday Countdown
            </h3>
            <LiveCountdown targetDate={result.nextBirthday.targetDate} />
            <p className="text-center text-xs text-ink-500 dark:text-ink-400 mt-2">
              {result.nextBirthday.weekday}, {result.nextBirthday.targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Day of Week Born */}
          <div className="p-4 rounded-2xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200 dark:border-ink-700">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100 mb-3 flex items-center gap-2">
              <Sunrise className="w-4 h-4 text-accent-500" />
              Born on a {result.dayOfWeek}
            </h3>
            <DayOfWeekCalendar birthDayOfWeek={result.birthDayOfWeek} />
          </div>

          {/* Workdays & Weekends */}
          <div className="p-4 rounded-2xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200 dark:border-ink-700">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-accent-500" />
              Workdays vs Weekends
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-ink-850 border border-ink-200 dark:border-ink-700">
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase className="w-4 h-4 text-sky-500" />
                  <span className="text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-500 font-medium">Workdays</span>
                </div>
                <p className="text-2xl font-bold text-ink-900 dark:text-ink-100">{result.workdays.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-ink-850 border border-ink-200 dark:border-ink-700">
                <div className="flex items-center gap-2 mb-1">
                  <Cake className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-500 font-medium">Weekends</span>
                </div>
                <p className="text-2xl font-bold text-ink-900 dark:text-ink-100">{result.weekends.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Heartbeats & Sleep */}
          <div className="p-4 rounded-2xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200 dark:border-ink-700">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent-500" />
              Your Body by Numbers
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-ink-850 border border-ink-200 dark:border-ink-700">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span className="text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-500 font-medium">Heartbeats</span>
                </div>
                <p className="text-2xl font-bold text-ink-900 dark:text-ink-100">{result.estimatedHeartbeats.toLocaleString()}</p>
                <p className="text-[10px] text-ink-400 dark:text-ink-500">~72 BPM average</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-ink-850 border border-ink-200 dark:border-ink-700">
                <div className="flex items-center gap-2 mb-1">
                  <Bed className="w-4 h-4 text-indigo-500" />
                  <span className="text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-500 font-medium">Sleep</span>
                </div>
                <p className="text-2xl font-bold text-ink-900 dark:text-ink-100">{result.estimatedSleepHours.toLocaleString()}</p>
                <p className="text-[10px] text-ink-400 dark:text-ink-500">~8h per day</p>
              </div>
            </div>
          </div>

          {/* Birthday Info */}
          <div className="p-4 rounded-2xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200 dark:border-ink-700">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100 mb-3 flex items-center gap-2">
              <Cake className="w-4 h-4 text-accent-500" />
              Birthday Info
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Stat label="Day of Year" value={`${result.dayOfYear} of 365`} />
              <Stat label="Days Left in Year" value={result.daysLeftInYear.toString()} />
              <Stat label="Half Birthday" value={result.halfBirthdayDays > 0 ? `${result.halfBirthdayDays} days` : 'Today!'} />
            </div>
          </div>

          {/* Life Progress */}
          <div className="p-4 rounded-2xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200 dark:border-ink-700">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100 mb-3 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-accent-500" />
              Life Progress
            </h3>
            <Progress value={result.lifeProgress} />
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-2 text-center">{result.lifeProgress.toFixed(2)}% of 80-year life expectancy</p>
          </div>

          {/* Zodiac Signs */}
          <div className="p-4 rounded-2xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200 dark:border-ink-700">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-accent-500" />
              Zodiac Signs
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-white dark:bg-ink-850 border border-ink-200 dark:border-ink-700">
                <p className="text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-500 font-medium mb-1">Western</p>
                <p className="text-lg font-bold gradient-text">{result.zodiac.name}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{result.zodiac.dates}</p>
                <p className="text-[10px] text-ink-400 dark:text-ink-500 mt-1">{result.zodiac.element} sign</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-ink-850 border border-ink-200 dark:border-ink-700">
                <p className="text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-500 font-medium mb-1">Chinese</p>
                <p className="text-lg font-bold gradient-text">{result.chineseZodiac.animal}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{result.chineseZodiac.years}</p>
              </div>
            </div>

            {/* Zodiac Compatibility */}
            <div className="mt-3">
              <p className="text-xs font-medium text-ink-500 dark:text-ink-400 mb-2">Check Compatibility</p>
              <div className="flex flex-wrap gap-1.5">
                {ZODIAC_SIGNS.map(z => (
                  <button
                    key={z.name}
                    onClick={() => setCompatSign(z.name === compatSign ? null : z.name)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      compatSign === z.name
                        ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-sm'
                        : 'bg-white dark:bg-ink-850 border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:border-brand-300 dark:hover:border-brand-500/40'
                    }`}
                  >
                    {z.name}
                  </button>
                ))}
              </div>
              {compat && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 p-3 rounded-xl bg-white dark:bg-ink-850 border border-ink-200 dark:border-ink-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                      {result.zodiac.name} + {compatSign}
                    </span>
                    <span className={`text-sm font-bold ${compat.color}`}>{compat.level}</span>
                  </div>
                  <div className="mb-2">
                    <div className="h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${compat.score}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    <p className="text-[10px] text-ink-400 dark:text-ink-500 mt-0.5 text-right">{compat.score}% match</p>
                  </div>
                  <p className="text-xs text-ink-500 dark:text-ink-400">{compat.description}</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Age on Other Planets */}
          <div className="p-4 rounded-2xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200 dark:border-ink-700">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100 mb-3 flex items-center gap-2">
              <Orbit className="w-4 h-4 text-accent-500" />
              Age on Other Planets
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {result.planetAges.map((p, i) => (
                <motion.div
                  key={p.planet}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-xl bg-white dark:bg-ink-850 border border-ink-200 dark:border-ink-700 text-center"
                >
                  <div className={`flex justify-center mb-1 ${p.color}`}>
                    <p.Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-ink-500 dark:text-ink-400">{p.planet}</span>
                  <p className="text-lg font-bold text-ink-900 dark:text-ink-100">{p.age.toLocaleString()}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Upcoming Milestones */}
          <div className="p-4 rounded-2xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200 dark:border-ink-700">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100 mb-3 flex items-center gap-2">
              <Milestone className="w-4 h-4 text-accent-500" />
              Upcoming Milestones
            </h3>
            <div className="space-y-1.5">
              {result.milestones.slice(0, 5).map((m, i) => (
                <motion.div
                  key={m.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-ink-850 border border-ink-200 dark:border-ink-700/50"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-accent-500"><m.Icon className="w-4 h-4" /></span>
                    <div>
                      <span className="text-sm font-medium text-ink-900 dark:text-ink-100">{m.name}</span>
                      <p className="text-xs text-ink-500 dark:text-ink-400">
                        {m.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-ink-500 dark:text-ink-400">
                    {m.daysAway.toLocaleString()} days
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
