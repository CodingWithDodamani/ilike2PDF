/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: { sm: '640px', md: '768px', tl: '900px', lg: '1024px', xl: '1280px' },
    extend: {
      colors: {
        brand: {
          50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af',
          400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c',
          800: '#9f1239', 900: '#881337', 950: '#4c0519',
        },
        accent: {
          300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
        },
        gold: {
          300: '#fde047', 400: '#facc15', 500: '#eab308', 600: '#ca8a04',
        },
        ink: {
          50: '#f8f8fc', 100: '#f0f0f7', 200: '#e2e2ee', 300: '#c7c7da',
          400: '#9494b0', 500: '#6b6b86', 600: '#4f4f66', 700: '#39394d',
          800: '#222230', 850: '#1a1a26', 900: '#121219', 925: '#0e0e16', 950: '#08080f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      borderRadius: { '2xl': '1.125rem', '3xl': '1.5rem', '4xl': '2rem', '5xl': '2.5rem' },
      boxShadow: {
        glow: '0 0 0 1px rgba(225,29,72,0.16), 0 24px 70px -20px rgba(225,29,72,0.5)',
        'glow-sm': '0 0 0 1px rgba(225,29,72,0.12), 0 12px 36px -14px rgba(225,29,72,0.4)',
        card: '0 1px 2px rgba(16,16,32,0.04), 0 4px 12px -4px rgba(16,16,32,0.08), 0 16px 40px -20px rgba(16,16,32,0.12)',
        'card-dark': '0 1px 2px rgba(0,0,0,0.5), 0 8px 28px -10px rgba(0,0,0,0.6)',
        'card-hover': '0 2px 4px rgba(16,16,32,0.05), 0 12px 28px -8px rgba(225,29,72,0.18), 0 28px 60px -24px rgba(225,29,72,0.25)',
        soft: '0 2px 8px -2px rgba(16,16,32,0.06), 0 12px 32px -12px rgba(16,16,32,0.1)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255,255,255,0.6)',
        'inner-glow-dark': 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'mesh': 'radial-gradient(at 15% 12%, rgba(225,29,72,0.28) 0px, transparent 45%), radial-gradient(at 85% 0%, rgba(249,115,22,0.2) 0px, transparent 48%), radial-gradient(at 75% 85%, rgba(244,63,94,0.22) 0px, transparent 50%), radial-gradient(at 5% 80%, rgba(251,146,60,0.14) 0px, transparent 50%)',
        'shine': 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%)',
        'grid-light': 'linear-gradient(to right, rgba(16,16,32,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(16,16,32,0.04) 1px, transparent 1px)',
        'grid-dark': 'linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '44px 44px',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'gradient-shift': { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        'shine-sweep': { '0%': { transform: 'translateX(-120%)' }, '60%,100%': { transform: 'translateX(120%)' } },
        'pulse-ring': { '0%': { transform: 'scale(0.9)', opacity: '0.6' }, '70%,100%': { transform: 'scale(1.6)', opacity: '0' } },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both',
        float: 'float 6s ease-in-out infinite',
        'spin-slow': 'spin-slow 1s linear infinite',
        shimmer: 'shimmer 1.5s infinite',
        'gradient-shift': 'gradient-shift 10s ease infinite',
        'shine-sweep': 'shine-sweep 2.5s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
}
