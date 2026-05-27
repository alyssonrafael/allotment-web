import { create } from 'zustand'
import type { AllotmentStatus } from '#/types'

/**
 * Os campos de um Allotment que podem ser alterados via interação do editor
 * (drag, resize, painel). Outros campos (id, code, eventId, timestamps) são
 * imutáveis no contexto de undo.
 */
export interface AllotmentDiff {
  x?: number
  y?: number
  width?: number
  height?: number
  name?: string
  price?: number
  status?: AllotmentStatus
}

export interface MutationEntry {
  kind: 'mutation'
  id: string
  before: AllotmentDiff
  after: AllotmentDiff
}

export type HistoryEntry = MutationEntry

interface HistoryState {
  past: Array<HistoryEntry>
  future: Array<HistoryEntry>
  push: (entry: HistoryEntry) => void
  popUndo: () => HistoryEntry | null
  popRedo: () => HistoryEntry | null
  clear: () => void
}

const MAX_HISTORY = 50

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  push: (entry) =>
    set((state) => ({
      past: [...state.past, entry].slice(-MAX_HISTORY),
      future: [],
    })),
  popUndo: () => {
    const { past, future } = get()
    if (past.length === 0) return null
    const entry = past[past.length - 1]
    set({ past: past.slice(0, -1), future: [entry, ...future] })
    return entry
  },
  popRedo: () => {
    const { past, future } = get()
    if (future.length === 0) return null
    const [entry, ...rest] = future
    set({ past: [...past, entry], future: rest })
    return entry
  },
  clear: () => set({ past: [], future: [] }),
}))
