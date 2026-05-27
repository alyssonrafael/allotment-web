import { create } from 'zustand'

interface CanvasStore {
  selectedId: string | null
  selectedIds: Array<string>
  zoom: number
  snapEnabled: boolean
  autosaveEnabled: boolean
  dirtyIds: Array<string>
  setSelected: (id: string | null) => void
  toggleSelected: (id: string) => void
  clearSelection: () => void
  setZoom: (zoom: number) => void
  toggleSnap: () => void
  toggleAutosave: () => void
  markDirty: (id: string) => void
  clearDirty: (id?: string) => void
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  selectedId: null,
  selectedIds: [],
  zoom: 1,
  snapEnabled: true,
  autosaveEnabled: false,
  dirtyIds: [],
  setSelected: (id) => set({ selectedId: id, selectedIds: id ? [id] : [] }),
  toggleSelected: (id) =>
    set((state) => {
      const exists = state.selectedIds.includes(id)
      const next = exists
        ? state.selectedIds.filter((x) => x !== id)
        : [...state.selectedIds, id]
      return { selectedIds: next, selectedId: next[next.length - 1] ?? null }
    }),
  clearSelection: () => set({ selectedId: null, selectedIds: [] }),
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(3, zoom)) }),
  toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),
  toggleAutosave: () => set((state) => ({ autosaveEnabled: !state.autosaveEnabled })),
  markDirty: (id) =>
    set((state) => (state.dirtyIds.includes(id) ? state : { dirtyIds: [...state.dirtyIds, id] })),
  clearDirty: (id) =>
    set((state) =>
      id === undefined
        ? { dirtyIds: [] }
        : { dirtyIds: state.dirtyIds.filter((x) => x !== id) },
    ),
}))
