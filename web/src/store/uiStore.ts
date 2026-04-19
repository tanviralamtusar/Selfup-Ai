import { create } from 'zustand'

type Mode = 'chat' | 'dashboard'
type Theme = 'dark' | 'light'
type ActiveCategory = 'fitness' | 'skills' | 'time' | 'style' | null

interface UIState {
  mode: Mode
  sidebarOpen: boolean
  activeCategory: ActiveCategory
  theme: Theme

  // Actions
  setMode: (mode: Mode) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setActiveCategory: (category: ActiveCategory) => void
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  if (theme === 'dark') {
    html.classList.add('dark')
    html.classList.remove('light')
  } else {
    html.classList.add('light')
    html.classList.remove('dark')
  }
}

// Detect system preference on first load
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem('selfup-theme')
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark' // Dark-first: always default to dark
}

const initialTheme = getInitialTheme()
if (typeof window !== 'undefined') {
  applyTheme(initialTheme)
}

export const useUIStore = create<UIState>()((set) => ({
  mode: 'dashboard',
  sidebarOpen: true,
  activeCategory: null,
  theme: initialTheme,

  setMode: (mode) => set({ mode }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark'
      applyTheme(newTheme)
      localStorage.setItem('selfup-theme', newTheme)
      return { theme: newTheme }
    }),
  setTheme: (theme) => {
    applyTheme(theme)
    localStorage.setItem('selfup-theme', theme)
    set({ theme })
  },
}))
