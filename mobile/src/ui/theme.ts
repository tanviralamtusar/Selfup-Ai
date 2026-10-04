// Dark palette from the website (web/src/app/globals.css, .dark).
export const colors = {
  background: '#1a1a1a',
  card: '#242424',
  cardRaised: '#2a2a2a',
  border: '#3a3a3a',
  text: '#ececec',
  textMuted: '#9e9e9e',
  primary: '#9c7ef0',
  primaryText: '#ffffff',
  accent: '#3d2e6b',
  accentText: '#c4b5fd',
  success: '#5db8a0',
  warning: '#d4a84b',
  danger: '#f28b82',
  hp: '#f28b82',
  xp: '#9c7ef0',
  coin: '#d4a84b',
} as const

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const

export const priorityColor: Record<string, string> = {
  low: '#7a7a8a',
  medium: '#5db8a0',
  high: '#d4a84b',
  critical: '#f28b82',
}
