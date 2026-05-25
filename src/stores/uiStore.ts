import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface UIStore {
  theme: Theme
  sidebarCollapsed: boolean
  activeEventId: string | null
  saveStatus: 'idle' | 'saving' | 'saved'
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setActiveEvent: (id: string | null) => void
  setSaveStatus: (status: 'idle' | 'saving' | 'saved') => void
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem('theme') as Theme | null
  if (stored === 'light' || stored === 'dark') return stored
  return 'light'
}

export const useUIStore = create<UIStore>((set) => ({
  theme: getInitialTheme(),
  sidebarCollapsed: false,
  activeEventId: null,
  saveStatus: 'saved',
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setActiveEvent: (id) => set({ activeEventId: id }),
  setSaveStatus: (status) => set({ saveStatus: status }),
}))
