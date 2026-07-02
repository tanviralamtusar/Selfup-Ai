import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Map to the shadcn CSS vars defined in globals.css :root / .dark
        background:  'var(--background)',
        foreground:  'var(--foreground)',
        card:        'var(--card)',
        surface:     'var(--card)',
        border:      { DEFAULT: 'var(--border)' },
        input:       'var(--input)',
        ring:        'var(--ring)',
        primary:     { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        secondary:   { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
        muted:       { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        accent:      { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
        popover:     { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
        destructive: 'var(--destructive)',
        // Semantic palette (static — used in gamification, charts, category colors)
        green:  { DEFAULT: '#34D399', 400: '#4ade80', 500: '#34D399' },
        amber:  { DEFAULT: '#d4a84b', 400: '#fbbf24', 500: '#f59e0b' },
        orange: { DEFAULT: '#FB923C', 400: '#fb923c', 500: '#f97316' },
        pink:   { DEFAULT: '#F472B6', 400: '#f472b6', 500: '#ec4899' },
        red:    { DEFAULT: '#F87171', 400: '#f87171', 500: '#ef4444' },
        rose:   { 400: '#fb7185', 500: '#f43f5e' },
        sky:    { 400: '#38bdf8' },
        emerald:{ 400: '#34d399', 500: '#10b981' },
        purple: { 400: '#c084fc', 500: '#a855f7' },
        teal:   { DEFAULT: '#5db8a0', 400: '#5db8a0' },
        coin:   '#d4a84b',
        xp:     '#9c7ef0',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Inter', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        headline: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'xp-fill': {
          '0%': { width: '0%' },
          '100%': { width: 'var(--xp-width)' },
        },
        'coin-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
        'float-up': {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-30px)' },
        },
        'flame': {
          '0%, 100%': { transform: 'scaleY(1) scaleX(1)' },
          '25%': { transform: 'scaleY(1.1) scaleX(0.9)' },
          '50%': { transform: 'scaleY(0.95) scaleX(1.05)' },
          '75%': { transform: 'scaleY(1.05) scaleX(0.95)' },
        },
        'typing-dot': {
          '0%, 60%, 100%': { opacity: '0.3', transform: 'translateY(0)' },
          '30%': { opacity: '1', transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fade-in 200ms ease',
        'scale-in': 'scale-in 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-right': 'slide-right 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'xp-fill': 'xp-fill 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'coin-bounce': 'coin-bounce 400ms ease-in-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float-up': 'float-up 600ms ease-out forwards',
        'flame': 'flame 1.5s ease-in-out infinite',
        'typing-dot': 'typing-dot 1.4s ease-in-out infinite',
      },
      spacing: {
        'sidebar': '240px',
        'topbar': '60px',
        'topbar-mobile': '56px',
        'bottomnav': '64px',
      },
    },
  },
  plugins: [],
}

export default config
