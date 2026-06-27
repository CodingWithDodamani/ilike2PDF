import React from 'react'

export function LogoIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* PDF Page Sheet */}
      <rect x="150" y="118" width="172" height="228" rx="22" fill="#ffffff" />
      {/* Folded Corner */}
      <path d="M322 118 L388 184 L322 184 Z" fill="#fecdd3" />
      {/* Lines on page */}
      <rect x="182" y="176" width="108" height="18" rx="9" fill="#e11d48" />
      <rect x="182" y="212" width="140" height="14" rx="7" fill="#fb7185" />
      <rect x="182" y="240" width="120" height="14" rx="7" fill="#fb7185" />
      <rect x="182" y="268" width="140" height="14" rx="7" fill="#fda4af" />
      {/* Aperture Badge */}
      <circle cx="342" cy="308" r="78" fill="#f97316" />
      <circle cx="342" cy="308" r="78" fill="none" stroke="#ffffff" strokeWidth="10" opacity="0.35" />
      <circle cx="342" cy="308" r="48" fill="none" stroke="#ffffff" strokeWidth="8" />
      <line x1="360" y1="308" x2="366" y2="349.6" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
      <line x1="351" y1="323.6" x2="318" y2="349.6" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
      <line x1="333" y1="323.6" x2="294" y2="308" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
      <line x1="324" y1="308" x2="318" y2="266.4" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
      <line x1="333" y1="292.4" x2="366" y2="266.4" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
      <line x1="351" y1="292.4" x2="390" y2="308" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}
