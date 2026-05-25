import { create } from 'zustand'
import type { Allotment } from '#/types'

interface HistoryStore {
  past: Array<Array<Allotment>>
  future: Array<Array<Allotment>>
  push: (snapshot: Array<Allotment>) => void
  undo: () => Array<Allotment> | null
  redo: () => Array<Allotment> | null
  clear: () => void
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  future: [],
  push: (snapshot) =>
    set((state) => ({
      past: [...state.past, snapshot].slice(-50),
      future: [],
    })),
  undo: () => {
    const { past } = get()
    if (past.length === 0) return null
    const previous = past[past.length - 1]
    set((state) => ({
      past: state.past.slice(0, -1),
      future: [previous, ...state.future],
    }))
    return previous
  },
  redo: () => {
    const { future } = get()
    if (future.length === 0) return null
    const [next, ...rest] = future
    set((state) => ({
      past: [...state.past, next],
      future: rest,
    }))
    return next
  },
  clear: () => set({ past: [], future: [] }),
}))
