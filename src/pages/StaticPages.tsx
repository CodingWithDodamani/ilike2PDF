import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  Shield, Lock, FileText, Mail, HelpCircle, History as HistoryIcon, Keyboard,
  Accessibility as AccessibilityIcon, WifiOff, Download, Scale, ChevronDown,
  Heart, CheckCircle2, Globe, Copy, Check,
  ExternalLink, Star, Code2, Sparkles,
} from 'lucide-react'

type PageKey =
  | 'about' | 'privacy' | 'terms' | 'contact' | 'faq' | 'changelog'
  | 'shortcuts' | 'accessibility' | 'offline' | 'pwa' | 'licenses'

const HOSTNAME = 'https://ilike2pdf.pages.dev'

const TITLES: Record<PageKey, { title: string; sub: string; description: string; icon: typeof Shield }> = {
  about: { title: 'About iLike2PDF', sub: 'A free, private, browser-first document toolkit.', description: 'Learn about iLike2PDF — a free, private, browser-first document toolkit with 94 tools that run entirely in your browser. No uploads, no tracking, works offline.', icon: Shield },
  privacy: { title: 'Privacy Policy', sub: 'How iLike2PDF handles (and doesn’t handle) your data.', description: 'iLike2PDF privacy policy — we collect no data, no files are uploaded, no tracking. Your files never leave your device.', icon: Lock },
  terms: { title: 'Terms of Use', sub: 'The simple rules for using iLike2PDF.', description: 'Terms of use for iLike2PDF — free, open-source document tools provided as-is without warranty.', icon: FileText },
  contact: { title: 'Contact', sub: 'Questions, feedback or bug reports — reach out.', description: 'Contact the iLike2PDF team — report bugs, request features, or ask questions via GitHub or email.', icon: Mail },
  faq: { title: 'Frequently Asked Questions', sub: 'Everything you might wonder about iLike2PDF.', description: 'iLike2PDF FAQ — answers about file privacy, offline use, file size limits, password removal, and browser support.', icon: HelpCircle },
  changelog: { title: 'Changelog', sub: 'What’s new and what’s coming.', description: 'iLike2PDF changelog — track new features, improvements, and releases for the privacy-first document toolkit.', icon: HistoryIcon },
  shortcuts: { title: 'Keyboard Shortcuts', sub: 'Work faster with the keyboard.', description: 'iLike2PDF keyboard shortcuts — Ctrl/Cmd+K for command palette, Esc to close dialogs, arrow keys to navigate.', icon: Keyboard },
  accessibility: { title: 'Accessibility', sub: 'Our commitment to WCAG 2.2 AA.', description: 'iLike2PDF accessibility statement — WCAG 2.2 AA compliant, keyboard operable, sufficient contrast, screen reader support.', icon: AccessibilityIcon },
  offline: { title: 'Offline Guide', sub: 'Use every tool with no connection.', description: 'iLike2PDF offline guide — install the PWA and use all 94 document tools without an internet connection.', icon: WifiOff },
  pwa: { title: 'Install iLike2PDF', sub: 'Add iLike2PDF to your device like a native app.', description: 'Install iLike2PDF as a Progressive Web App on desktop, iOS, or Android for offline access to all tools.', icon: Download },
  licenses: { title: 'Open-Source Licenses', sub: 'The libraries that power iLike2PDF.', description: 'iLike2PDF open-source licenses — MIT, Apache-2.0, ISC licenses for React, pdf-lib, PDF.js, qrcode, and more.', icon: Scale },
}

function H2({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-bold mt-8 mb-3 first:mt-0">{children}</h2>
}
function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={`text-ink-600 dark:text-ink-300 leading-relaxed mb-4 ${className ?? ''}`}>{children}</p>
}
function UL({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2 mb-4">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-ink-600 dark:text-ink-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

/* ---------------- ABOUT ---------------- */
function About() {
  return (
    <Prose>
      {/* Hero Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-3xl overflow-hidden mb-10 not-prose"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-purple-600 to-accent-500" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" style={{ animationDelay: '1s', animationDuration: '4s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent-400/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '2s', animationDuration: '5s' }} />
        </div>

        {/* Floating decorative elements */}
        <div className="absolute top-6 left-8 opacity-20">
          <Code2 className="w-8 h-8 text-white animate-bounce" style={{ animationDuration: '3s' }} />
        </div>
        <div className="absolute top-10 right-12 opacity-20">
          <Sparkles className="w-6 h-6 text-white animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
        </div>
        <div className="absolute bottom-8 left-16 opacity-20">
          <Star className="w-5 h-5 text-white animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }} />
        </div>
        <div className="absolute bottom-12 right-20 opacity-20">
          <img src="https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/github.svg" alt="" className="w-7 h-7 invert brightness-0 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }} />
        </div>

        <div className="relative px-8 py-14 text-center text-white">
          {/* Profile Image */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="relative inline-block mb-6"
          >
            {/* Rotating ring */}
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-white/40 via-white/10 to-white/40 animate-spin" style={{ animationDuration: '8s' }} />
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-accent-400 via-purple-400 to-brand-400 opacity-60 blur-sm" />
            <img
              src="https://codingwithdodamani.github.io/TableSync/hallu-dodamani.png"
              alt="Hallu Dodamani"
              className="relative w-36 h-36 rounded-full border-4 border-white/30 shadow-2xl object-cover"
            />
            {/* Verified badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.8 }}
              className="absolute -bottom-1 -right-1 w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg border-3 border-white"
            >
              <CheckCircle2 className="h-6 w-6" />
            </motion.div>
          </motion.div>

          {/* Creator Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span className="inline-block px-5 py-1.5 rounded-full bg-white/20 text-xs font-semibold mb-4 backdrop-blur-sm border border-white/20 tracking-wide uppercase">
              Creator
            </span>
          </motion.div>

          {/* Name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-4xl sm:text-5xl font-extrabold mb-3 tracking-tight"
          >
            Hallu Dodamani
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-lg sm:text-xl text-white/80 mb-8 max-w-lg mx-auto"
          >
            Frontend & Web Developer | Utility Tools Builder | UI/UX Enthusiast
            <br />
            <span className="text-sm text-white/60">Turning ideas into clean, fast & responsive web experiences</span>
          </motion.p>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-3"
          >
            <a href="https://github.com/CodingWithDodamani" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-all duration-300 font-medium text-sm border border-white/20 hover:scale-105 hover:shadow-lg hover:shadow-white/10">
              <img src="https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/github.svg" alt="" className="w-4 h-4 invert brightness-0" /> GitHub
            </a>
            <a href="https://www.linkedin.com/in/halludodamani/" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#0958a8] transition-all duration-300 font-medium text-sm hover:scale-105 hover:shadow-lg hover:shadow-[#0A66C2]/30">
              <img src="https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/linkedin.svg" alt="" className="w-4 h-4" /> LinkedIn
            </a>
            <a href="https://www.instagram.com/royal_hudga_hallu777/" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:opacity-90 transition-all duration-300 font-medium text-sm hover:scale-105 hover:shadow-lg hover:shadow-pink-500/30">
              <img src="https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/instagram.svg" alt="" className="w-4 h-4" /> Instagram
            </a>
            <a href="mailto:halludodamani@gmail.com"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-all duration-300 font-medium text-sm border border-white/20 hover:scale-105 hover:shadow-lg hover:shadow-white/10">
              <img src="https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/gmail.svg" alt="" className="w-4 h-4" /> Email
            </a>
            <a href="https://www.youtube.com/@Dodamanicraftschannel" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF0000] hover:bg-[#cc0000] transition-all duration-300 font-medium text-sm hover:scale-105 hover:shadow-lg hover:shadow-[#FF0000]/30">
              <img src="https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/youtube.svg" alt="" className="w-4 h-4 invert brightness-0" /> YouTube
            </a>
            <a href="https://www.pinterest.com/dodamanihallu75/" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E60023] hover:bg-[#bd001f] transition-all duration-300 font-medium text-sm hover:scale-105 hover:shadow-lg hover:shadow-[#E60023]/30">
              <img src="https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/pinterest.svg" alt="" className="w-4 h-4 invert brightness-0" /> Pinterest
            </a>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex justify-center gap-8 mt-10 pt-8 border-t border-white/20"
          >
            {[
              { n: '26', label: 'Repositories' },
              { n: '12', label: 'Stars Earned' },
              { n: '6+', label: 'Languages' },
              { n: '5+', label: 'Deployments' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
                className="text-center"
              >
                <p className="text-2xl sm:text-3xl font-extrabold">{s.n}</p>
                <p className="text-xs text-white/60 mt-1">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* About Me */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative"
      >
        {/* Section header with accent */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/25">
            <span className="text-xl">👋</span>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">About Me</h2>
            <div className="h-1 w-12 bg-gradient-to-r from-brand-500 to-accent-500 rounded-full mt-1" />
          </div>
        </div>

        {/* Bio cards */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="card p-6 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-500 to-purple-500 rounded-r-full" />
            <div className="pl-4">
              <p className="text-ink-600 dark:text-ink-300 leading-relaxed text-base">
                Hi! I'm <span className="font-bold text-brand-500">Hallu Dodamani</span>, a
                <span className="font-semibold"> Frontend & Web Developer</span> from <span className="font-semibold">Bangalore, India</span>.
                I specialize in building <span className="font-semibold">utility tools</span> and
                <span className="font-semibold"> clean web experiences</span> that make developers' lives easier.
                I'm passionate about <span className="font-semibold text-brand-500">turning ideas into fast, responsive, and beautifully designed products</span>.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="card p-6 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500 rounded-r-full" />
            <div className="pl-4">
              <p className="text-ink-600 dark:text-ink-300 leading-relaxed text-base">
                With <span className="font-bold text-purple-500">26+ repositories</span> and experience across
                <span className="font-semibold"> JavaScript, React, Node.js, Python, TypeScript</span>, and more —
                I've built everything from
                <span className="font-semibold"> AI-powered tools</span> like PromptVision AI and CodeExplainer,
                to <span className="font-semibold">productivity apps</span> like TableSync and DropMail.
                I'm always exploring new technologies and pushing the boundaries of what's possible on the web.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="card p-6 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent-500 to-emerald-500 rounded-r-full" />
            <div className="pl-4">
              <p className="text-ink-600 dark:text-ink-300 leading-relaxed text-base">
                I'm the creator of <span className="font-semibold text-brand-500">iLike2PDF</span> — a privacy-first
                document toolkit with <span className="font-semibold">94 tools</span> that run entirely in the browser.
                I believe in <span className="font-semibold text-accent-500">building in public</span>,
                <span className="font-semibold text-accent-500"> shipping fast</span>, and
                <span className="font-semibold text-accent-500"> open-source everything</span>.
                Open to collaborations, freelance projects, and connecting with fellow developers.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Animated border highlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-6 flex justify-center"
        >
          <div className="animate-border-rotate w-full max-w-md overflow-hidden">
            <div className="relative z-10 rounded-2xl bg-white dark:bg-ink-900 p-5 text-center m-[2px]">
              <p className="text-sm font-bold bg-gradient-to-r from-brand-500 via-accent-500 to-purple-500 bg-clip-text text-transparent">
                94+ Browser-First Tools
              </p>
              <p className="text-xs text-ink-400 mt-1">Privacy-first. Zero uploads. Everything runs locally.</p>
            </div>
          </div>
        </motion.div>

        {/* Quick facts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6"
        >
          {[
            { icon: <img src="https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/google-maps.svg" alt="Location" className="w-5 h-5" />, label: 'Location', value: 'Bangalore', color: 'text-brand-500' },
            { icon: <img src="https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/visual-studio-code.svg" alt="Focus" className="w-5 h-5" />, label: 'Focus', value: 'Frontend & Tools', color: 'text-purple-500' },
            { icon: <img src="https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/typescript.svg" alt="Languages" className="w-5 h-5" />, label: 'Languages', value: '6+ Tech Stack', color: 'text-accent-500' },
            { icon: <img src="https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/slack.svg" alt="Collaborations" className="w-5 h-5" />, label: 'Open to', value: 'Collaborations', color: 'text-emerald-500' },
          ].map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + i * 0.1 }}
              whileHover={{ y: -3 }}
              className="card p-3 text-center group cursor-default"
            >
              <span className={`${f.color} block mb-1 group-hover:scale-110 transition-transform`}>{f.icon}</span>
              <p className="text-xs text-ink-400">{f.label}</p>
              <p className="text-sm font-bold">{f.value}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Skills */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="mt-10"
      >
        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <span className="text-xl">🛠️</span>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Skills & Technologies</h2>
            <div className="h-1 w-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mt-1" />
          </div>
        </div>

        <p className="text-ink-500 dark:text-ink-400 mb-6 text-sm">
          Technologies I work with daily to build modern web applications.
        </p>

        {/* Skills grid with real logos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: 'JavaScript', level: 'Expert', gradient: 'from-yellow-400/20 to-amber-400/20', border: 'border-yellow-400/30', iconBg: 'bg-yellow-400/10', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/javascript.svg' },
            { name: 'React', level: 'Expert', gradient: 'from-cyan-400/20 to-sky-400/20', border: 'border-cyan-400/30', iconBg: 'bg-cyan-400/10', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/react.svg' },
            { name: 'Node.js', level: 'Expert', gradient: 'from-green-400/20 to-emerald-400/20', border: 'border-green-400/30', iconBg: 'bg-green-400/10', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/nodejs.svg' },
            { name: 'Python', level: 'Advanced', gradient: 'from-blue-400/20 to-indigo-400/20', border: 'border-blue-400/30', iconBg: 'bg-blue-400/10', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/python.svg' },
            { name: 'Tailwind CSS', level: 'Expert', gradient: 'from-cyan-400/20 to-teal-400/20', border: 'border-cyan-400/30', iconBg: 'bg-cyan-400/10', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/tailwindcss.svg' },
            { name: 'MongoDB', level: 'Advanced', gradient: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30', iconBg: 'bg-green-500/10', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/mongodb.svg' },
            { name: 'Docker', level: 'Intermediate', gradient: 'from-blue-500/20 to-sky-500/20', border: 'border-blue-500/30', iconBg: 'bg-blue-500/10', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/docker.svg' },
            { name: 'AWS', level: 'Intermediate', gradient: 'from-orange-400/20 to-amber-400/20', border: 'border-orange-400/30', iconBg: 'bg-orange-400/10', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/aws.svg' },
          ].map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 200 }}
              whileHover={{ scale: 1.05, y: -6, transition: { duration: 0.2 } }}
              className={`relative rounded-2xl p-4 text-center cursor-default group border ${s.border} bg-gradient-to-br ${s.gradient} backdrop-blur-sm overflow-hidden`}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/10 to-transparent" />

              <div className={`relative w-14 h-14 rounded-2xl ${s.iconBg} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 p-2`}>
                <img src={s.logo} alt={s.name} className="w-full h-full object-contain" loading="lazy" />
              </div>
              <p className="font-bold text-sm mb-1">{s.name}</p>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase
                ${s.level === 'Expert' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                  s.level === 'Advanced' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                  'bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                {s.level}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Additional skills row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <p className="text-xs text-ink-400 mb-3 font-medium uppercase tracking-wider">Also familiar with</p>
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'Git', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/git.svg' },
              { name: 'HTML5', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/html.svg' },
              { name: 'CSS3', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/css.svg' },
              { name: 'Firebase', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/firebase.svg' },
              { name: 'Vercel', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/vercel.svg' },
              { name: 'Netlify', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/netlify.svg' },
              { name: 'MySQL', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/mysql.svg' },
              { name: 'React Native', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/react.svg' },
              { name: 'Vite', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/vite.svg' },
              { name: 'WordPress', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/wordpress.svg' },
              { name: 'Google Cloud', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/google-cloud.svg' },
              { name: 'Figma', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/figma.svg' },
              { name: 'Three.js', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/threejs.svg' },
              { name: 'NPM', logo: 'https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/npm.svg' },
            ].map((skill, i) => (
              <motion.span
                key={skill.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.03 }}
                whileHover={{ scale: 1.08, y: -2 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-100 dark:bg-ink-800 text-xs font-medium hover:bg-brand-500/10 hover:text-brand-500 transition-colors cursor-default border border-transparent hover:border-brand-500/20"
              >
                {skill.logo && <img src={skill.logo} alt="" className="w-3.5 h-3.5 object-contain" loading="lazy" />}
                {skill.name}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Projects */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
        <H2>Projects</H2>
        <div className="grid sm:grid-cols-2 gap-4 not-prose my-4">
          {[
            {
              href: 'https://github.com/CodingWithDodamani/TableSync',
              img: 'https://codingwithdodamani.github.io/TableSync/hallu-dodamani.png',
              name: 'TableSync',
              desc: 'Seamless table transfers from Excel, Word, or any website with perfect format preservation.',
              gradient: 'from-blue-500 to-purple-500',
              lang: 'HTML',
            },
            {
              href: 'https://github.com/CodingWithDodamani/AI-prompt-Enhacer-',
              img: 'https://codingwithdodamani.github.io/PromptVision/assets/images/developer.png',
              name: 'AI Prompt Enhancer',
              desc: 'Transform simple ideas into powerful, detailed AI prompts for emails, code, images, and more.',
              gradient: 'from-purple-500 to-pink-500',
              lang: 'TypeScript',
            },
            {
              href: 'https://github.com/CodingWithDodamani/Simplify',
              img: 'https://codingwithdodamani.github.io/TableSync/hallu-dodamani.png',
              name: 'Simplify',
              desc: 'Transform legal documents, research papers, and technical manuals into clear, understandable language.',
              gradient: 'from-cyan-500 to-blue-500',
              lang: 'JavaScript',
            },
            {
              href: 'https://github.com/CodingWithDodamani/DropMail',
              img: 'https://codingwithdodamani.github.io/TableSync/hallu-dodamani.png',
              name: 'DropMail',
              desc: 'Modern temporary email generator with liquid glass UI and interactive particle background.',
              gradient: 'from-emerald-500 to-teal-500',
              lang: 'CSS',
            },
            {
              href: 'https://github.com/CodingWithDodamani/Product-Vision',
              img: 'https://codingwithdodamani.github.io/TableSync/hallu-dodamani.png',
              name: 'Product Vision',
              desc: 'Turn product ideas into professional specification documents with user stories and features.',
              gradient: 'from-orange-500 to-amber-500',
              lang: 'HTML',
            },
            {
              href: '',
              name: 'iLike2PDF',
              desc: '94+ free document tools that run entirely in your browser. Zero uploads. Works offline.',
              gradient: 'from-brand-500 to-accent-500',
              isCurrent: true,
              lang: 'React + TypeScript',
            },
          ].map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              {p.href ? (
                <a href={p.href} target="_blank" rel="noreferrer"
                  className="block card p-5 hover:border-brand-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/10 h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={p.img} alt={p.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20 shadow-md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{p.name}</p>
                      <span className="text-xs text-ink-400 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Visit Project
                      </span>
                    </div>
                    {p.lang && <span className="badge text-[10px] shrink-0">{p.lang}</span>}
                  </div>
                  <p className="text-sm text-ink-500">{p.desc}</p>
                </a>
              ) : (
                <div className="card p-5 border-brand-500/30 bg-gradient-to-br from-brand-500/5 to-accent-400/5 h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${p.gradient} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
                      i
                    </div>
                    <div>
                      <p className="font-semibold gradient-text">{p.name}</p>
                      <span className="text-xs text-brand-500 font-medium">Current Project</span>
                    </div>
                  </div>
                  <p className="text-sm text-ink-500">{p.desc}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Why iLike2PDF */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <H2>Why I Built iLike2PDF</H2>
        <P>
          Most "free" online PDF tools quietly upload your documents to a server. For contracts,
          IDs, medical records and financial statements, that is an unnecessary risk. iLike2PDF proves
          you don't need a server at all — modern browsers are powerful enough to do the work safely
          on your machine.
        </P>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
        <H2>Principles</H2>
        <UL items={[
          'Privacy by architecture, not by promise — there is no upload endpoint.',
          'Fast by default — code-split, lazy-loaded, and cached for offline use.',
          'Accessible to everyone — built to WCAG 2.2 AA.',
          'Open and transparent — the source is available for anyone to audit.',
        ]} />
      </motion.div>

      {/* Contact CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="card p-10 not-prose text-center bg-gradient-to-br from-brand-500/10 via-purple-500/5 to-accent-400/10 mt-10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand-500/25"
          >
            <Mail className="h-8 w-8 text-white" />
          </motion.div>
          <h3 className="text-2xl font-bold mb-3">Let's Work Together!</h3>
          <p className="text-ink-500 dark:text-ink-400 mb-6 max-w-md mx-auto">
            Have a project in mind or just want to say hi? I'd love to hear from you.
          </p>
          <a href="mailto:halludodamani@gmail.com" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3">
            <Mail className="h-5 w-5" /> Get in Touch
          </a>
        </div>
      </motion.div>
    </Prose>
  )
}

/* ---------------- PRIVACY ---------------- */
function Privacy() {
  return (
    <Prose>
      <div className="card p-4 not-prose mb-6 border-emerald-500/30 bg-emerald-500/5">
        <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <Shield className="h-5 w-5" /> The short version
        </p>
        <p className="text-sm text-ink-600 dark:text-ink-300 mt-1">
          We don’t collect your files, we don’t use analytics or cookies, and nothing you process
          is ever sent to a server. Everything happens in your browser.
        </p>
      </div>
      <H2>What we collect</H2>
      <P>Nothing. iLike2PDF has no backend, no database, and no telemetry. There is no account system.</P>
      <H2>Your files</H2>
      <P>
        Files you open are read directly by your browser and processed in memory using JavaScript and
        WebAssembly. They are never transmitted over the network. When you close the tab, they’re gone.
      </P>
      <H2>Local storage</H2>
      <P>
        The only thing iLike2PDF stores in your browser’s <code className="font-mono text-brand-500">localStorage</code>
        is your theme preference (light / dark / system). We keep no history of your files and gather no usage
        statistics. Nothing leaves your device.
      </P>
      <H2>Third parties</H2>
      <P>
        Fonts and a few JavaScript libraries are loaded from public CDNs. These providers may see your IP
        address as part of serving those static assets, but receive none of your file content.
      </P>
      <P className="text-sm text-ink-500">Last updated: June 2026.</P>
    </Prose>
  )
}

/* ---------------- TERMS ---------------- */
function Terms() {
  return (
    <Prose>
      <H2>Acceptance</H2>
      <P>By using iLike2PDF you agree to these terms. If you don’t agree, please don’t use the service.</P>
      <H2>The service</H2>
      <P>
        iLike2PDF is provided free of charge, “as is”, without warranty of any kind. Because all processing
        happens locally in your browser, results may vary depending on your device, browser and the files
        you provide. Always keep backups of important documents.
      </P>
      <H2>Acceptable use</H2>
      <UL items={[
        'Use iLike2PDF only for content you own or are authorized to process.',
        'Do not use it to infringe copyright or violate any law.',
        'Do not attempt to misrepresent iLike2PDF as your own commercial service without complying with its open-source license.',
      ]} />
      <H2>Limitation of liability</H2>
      <P>
        To the maximum extent permitted by law, iLike2PDF and its contributors are not liable for any loss
        of data, profits or other damages arising from use of the tools. You are responsible for verifying
        output before relying on it.
      </P>
      <P className="text-sm text-ink-500">Last updated: June 2026.</P>
    </Prose>
  )
}

/* ---------------- CONTACT ---------------- */
function Contact() {
  return (
    <Prose>
      <P>
        iLike2PDF is a community-driven open-source project. The best way to report a bug, request a feature
        or ask a question is through the project repository.
      </P>
      <div className="grid sm:grid-cols-2 gap-3 not-prose my-6">
        <a href="https://github.com/CodingWithDodamani/ilike2PDF" target="_blank" rel="noreferrer" className="card p-5 hover:border-brand-500/50 transition group">
          <img src="https://raw.githubusercontent.com/ln-dev7/logos-apps/master/logos/github.svg" alt="" className="h-7 w-7 mb-2" />
          <p className="font-semibold group-hover:text-brand-500 transition">Open an issue</p>
          <p className="text-sm text-ink-500">Report bugs or request features on GitHub.</p>
        </a>
        <a href="mailto:hello@ilike2pdf.app" className="card p-5 hover:border-brand-500/50 transition group">
          <Mail className="h-7 w-7 text-brand-500 mb-2" />
          <p className="font-semibold group-hover:text-brand-500 transition">Email us</p>
          <p className="text-sm text-ink-500">hello@ilike2pdf.app</p>
        </a>
      </div>
      <H2>Before you reach out</H2>
      <P>
        Many questions are answered on the <Link to="/faq" className="text-brand-500 hover:underline">FAQ</Link> page.
        For “how do I install the app” questions, see the <Link to="/pwa-install" className="text-brand-500 hover:underline">Install guide</Link>.
      </P>
    </Prose>
  )
}

/* ---------------- FAQ ---------------- */
const FAQS: { q: string; a: ReactNode }[] = [
  { q: 'Are my files uploaded anywhere?', a: 'No. Every tool runs entirely in your browser. There is no server endpoint that receives your files — they never leave your device.' },
  { q: 'Is iLike2PDF really free?', a: 'Yes, completely. There are no accounts, no paywalls, no premium tiers and no ads. It is open-source software.' },
  { q: 'Does it work offline?', a: 'Yes. iLike2PDF is a Progressive Web App. After your first visit it caches everything needed, so you can install it and use every tool with no connection.' },
  { q: 'How large a file can I process?', a: 'It depends on your device’s available memory rather than any fixed limit. Most phones handle files up to ~50 MB comfortably; desktops can go much higher.' },
  { q: 'Can iLike2PDF compress a PDF without losing text?', a: 'Our Compress PDF tool re-rasterizes pages to shrink size, which flattens selectable text into images. For text-preserving optimization, try removing unused pages or images instead.' },
  { q: 'Can it remove a password I don’t know?', a: 'No. The Unlock tool only removes a password you already know — it does not crack encryption. That would be both impractical in a browser and unethical.' },
  { q: 'Do you keep a history of my files?', a: 'No. iLike2PDF stores no history and no usage statistics. The only thing saved locally is your theme preference.' },
  { q: 'Which browsers are supported?', a: 'Any modern browser — Chrome, Edge, Firefox and Safari (recent versions). Some advanced features rely on the latest Web APIs.' },
]
function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="grid gap-3">
      {FAQS.map((f, i) => (
        <div key={i} className="card overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="w-full flex items-center justify-between gap-3 p-4 text-left focus-ring"
          >
            <span className="font-semibold">{f.q}</span>
            <ChevronDown className={`h-5 w-5 text-ink-400 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && <div className="px-4 pb-4 text-ink-600 dark:text-ink-300 leading-relaxed">{f.a}</div>}
        </div>
      ))}
    </div>
  )
}

/* ---------------- CHANGELOG ---------------- */
const RELEASES: { v: string; date: string; tag: string; items: string[] }[] = [
  {
    v: '1.0.0', date: 'June 2026', tag: 'Launch',
    items: [
      '94 tools across PDF, Image, QR and Utility categories.',
      'Installable PWA with full offline support.',
      'Command Palette (Ctrl K) with fuzzy search.',
      'Smart File Router that suggests the best tool for a dropped file.',
      'Light / dark / system themes and WCAG 2.2 AA accessibility.',
    ],
  },
]
function Changelog() {
  return (
    <div className="relative pl-6">
      <div className="absolute left-1.5 top-2 bottom-2 w-px bg-ink-200 dark:bg-ink-800" />
      {RELEASES.map((r) => (
        <div key={r.v} className="relative mb-8">
          <span className="absolute -left-[1.42rem] top-1.5 h-3 w-3 rounded-full bg-brand-500 ring-4 ring-white dark:ring-ink-950" />
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-lg font-bold">v{r.v}</span>
            <span className="badge">{r.tag}</span>
            <span className="text-sm text-ink-500">{r.date}</span>
          </div>
          <UL items={r.items} />
        </div>
      ))}
    </div>
  )
}

/* ---------------- SHORTCUTS ---------------- */
const SHORTCUTS: { keys: string[]; desc: string }[] = [
  { keys: ['Ctrl', 'K'], desc: 'Open the Command Palette' },
  { keys: ['Esc'], desc: 'Close dialogs / palette' },
  { keys: ['↑', '↓'], desc: 'Navigate palette results' },
  { keys: ['Enter'], desc: 'Open the selected tool' },
  { keys: ['Tab'], desc: 'Move between interactive elements' },
  { keys: ['/'], desc: 'Focus search on category pages' },
]
function Shortcuts() {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {SHORTCUTS.map((s, i) => (
        <div key={i} className="card p-4 flex items-center justify-between gap-3">
          <span className="text-ink-600 dark:text-ink-300">{s.desc}</span>
          <span className="flex items-center gap-1">
            {s.keys.map((k) => (
              <kbd key={k} className="px-2 py-1 rounded-md bg-ink-100 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 text-xs font-mono font-semibold">{k}</kbd>
            ))}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ---------------- ACCESSIBILITY ---------------- */
function AccessibilityPage() {
  return (
    <Prose>
      <P>
        iLike2PDF is designed to meet <strong>WCAG 2.2 Level AA</strong>. Accessibility isn’t a feature we
        bolt on — it’s a baseline requirement for every page and tool.
      </P>
      <H2>What we’ve done</H2>
      <UL items={[
        'Full keyboard operability — every control is reachable and usable without a mouse.',
        'Visible focus indicators on all interactive elements.',
        'Semantic landmarks (header, nav, main, footer) and proper heading order.',
        'Sufficient color contrast in both light and dark themes.',
        'ARIA labels on icon-only buttons and live regions for status updates.',
        'Respect for prefers-reduced-motion and prefers-color-scheme.',
      ]} />
      <H2>Found a barrier?</H2>
      <P>
        Accessibility is never “done”. If something doesn’t work for you, please
        <Link to="/contact" className="text-brand-500 hover:underline"> let us know</Link> so we can fix it.
      </P>
    </Prose>
  )
}

/* ---------------- OFFLINE ---------------- */
function Offline() {
  return (
    <Prose>
      <P>
        iLike2PDF works without an internet connection. Because all tools run locally, the only thing that
        needs to load is the app itself — and after your first visit, it’s cached on your device.
      </P>
      <H2>How to use it offline</H2>
      <div className="grid sm:grid-cols-3 gap-3 not-prose my-6">
        {[
          { n: '1', t: 'Visit once online', d: 'Open iLike2PDF while connected so it can cache the app.' },
          { n: '2', t: 'Install (optional)', d: 'Add it to your device for an app-like, offline experience.' },
          { n: '3', t: 'Go offline', d: 'Open it anytime — every tool keeps working.' },
        ].map((s) => (
          <div key={s.n} className="card p-4">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-white font-bold mb-2">{s.n}</span>
            <p className="font-semibold">{s.t}</p>
            <p className="text-sm text-ink-500">{s.d}</p>
          </div>
        ))}
      </div>
      <H2>What needs a connection?</H2>
      <P>
        Only the QR generator’s optional logo-from-URL and any explicitly online actions need a network.
        Core PDF, image and QR processing all work fully offline.
      </P>
      <P className="not-prose">
        <Link to="/pwa-install" className="btn-primary"><Download className="h-4 w-4" /> Install guide</Link>
      </P>
    </Prose>
  )
}

/* ---------------- PWA INSTALL ---------------- */
function Pwa() {
  return (
    <Prose>
      <P>
        iLike2PDF is a Progressive Web App, so you can install it like a native app — with its own icon,
        window and full offline support — without any app store.
      </P>
      <H2>Desktop (Chrome / Edge)</H2>
      <UL items={[
        'Look for the install icon in the address bar, or open the browser menu.',
        'Choose “Install iLike2PDF”.',
        'Launch it from your dock, taskbar or start menu like any app.',
      ]} />
      <H2>iPhone / iPad (Safari)</H2>
      <UL items={[
        'Tap the Share button.',
        'Scroll down and tap “Add to Home Screen”.',
        'Tap “Add” — iLike2PDF now appears on your home screen.',
      ]} />
      <H2>Android (Chrome)</H2>
      <UL items={[
        'Tap the three-dot menu.',
        'Tap “Install app” or “Add to Home screen”.',
        'Confirm to add the icon to your launcher.',
      ]} />
      <div className="card p-4 not-prose bg-brand-500/5 border-brand-500/30">
        <p className="flex items-center gap-2 font-semibold text-brand-600 dark:text-brand-400">
          <Globe className="h-5 w-5" /> Tip
        </p>
        <p className="text-sm text-ink-600 dark:text-ink-300 mt-1">
          When an install prompt is available, iLike2PDF shows a one-tap install button automatically.
        </p>
      </div>
    </Prose>
  )
}

/* ---------------- LICENSES ---------------- */
const LIBS: { name: string; license: string; use: string }[] = [
  { name: 'React', license: 'MIT', use: 'UI framework' },
  { name: 'React Router', license: 'MIT', use: 'Client-side routing' },
  { name: 'Vite', license: 'MIT', use: 'Build tooling' },
  { name: 'Tailwind CSS', license: 'MIT', use: 'Styling system' },
  { name: 'Framer Motion', license: 'MIT', use: 'Animations' },
  { name: 'Lucide Icons', license: 'ISC', use: 'Icon set' },
  { name: 'pdf-lib', license: 'MIT', use: 'PDF creation & editing' },
  { name: 'pdf.js', license: 'Apache-2.0', use: 'PDF rendering & text extraction' },
  { name: 'qrcode', license: 'MIT', use: 'QR code generation' },
  { name: 'jsQR', license: 'Apache-2.0', use: 'QR code scanning' },
  { name: 'browser-image-compression', license: 'MIT', use: 'Image compression' },
  { name: 'exifr', license: 'MIT', use: 'EXIF metadata parsing' },
  { name: 'Fuse.js', license: 'Apache-2.0', use: 'Fuzzy search' },
  { name: 'react-markdown', license: 'MIT', use: 'Markdown rendering' },
  { name: 'JSZip', license: 'MIT', use: 'ZIP archive creation' },
]
function Licenses() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(LIBS.map((l) => `${l.name} — ${l.license}`).join('\n')).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div>
      <P>
        iLike2PDF stands on the shoulders of incredible open-source projects. We’re grateful to every
        maintainer and contributor. Below are the major libraries we use and their licenses.
      </P>
      <div className="flex justify-end mb-3">
        <button onClick={copy} className="btn-ghost btn-sm">
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />} Copy list
        </button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 dark:bg-ink-900 text-left">
            <tr>
              <th className="p-3 font-semibold">Library</th>
              <th className="p-3 font-semibold">License</th>
              <th className="p-3 font-semibold hidden sm:table-cell">Used for</th>
            </tr>
          </thead>
          <tbody>
            {LIBS.map((l, i) => (
              <tr key={l.name} className={i % 2 ? 'bg-ink-50/50 dark:bg-ink-900/40' : ''}>
                <td className="p-3 font-medium">{l.name}</td>
                <td className="p-3"><span className="badge">{l.license}</span></td>
                <td className="p-3 text-ink-500 hidden sm:table-cell">{l.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-ink-500 mt-4 flex items-center gap-2">
        <Heart className="h-4 w-4 text-rose-500" /> Made with open source.
      </p>
    </div>
  )
}

function Prose({ children }: { children: ReactNode }) {
  return <div className="max-w-none">{children}</div>
}

const RENDERERS: Record<PageKey, () => ReactNode> = {
  about: About,
  privacy: Privacy,
  terms: Terms,
  contact: Contact,
  faq: FAQ,
  changelog: Changelog,
  shortcuts: Shortcuts,
  accessibility: AccessibilityPage,
  offline: Offline,
  pwa: Pwa,
  licenses: Licenses,
}

export default function StaticPage({ page }: { page: string }) {
  const key = (page in TITLES ? page : 'about') as PageKey
  const meta = TITLES[key]
  const Icon = meta.icon
  const Body = RENDERERS[key]

  const url = `${HOSTNAME}/${page}`
  const title = `${meta.title} — iLike2PDF`

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={meta.description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:url" content={url} />
        <meta property="og:site_name" content="iLike2PDF" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={meta.description} />
      </Helmet>
      <div className="mx-auto max-w-3xl px-5 sm:px-6 py-14">
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <span className="relative grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-glow-sm">
              <span className="absolute inset-0 rounded-3xl bg-shine opacity-30" aria-hidden />
              <Icon className="relative h-7 w-7" />
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">{meta.title}</h1>
          </div>
          <p className="text-ink-500 dark:text-ink-400">{meta.sub}</p>
        </header>
        <Body />
      </div>
    </>
  )
}
