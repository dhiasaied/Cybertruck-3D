import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { FINISHES, PALETTES } from '../lib/presets'
import { detectInitialQuality } from '../lib/device'

/* localStorage can throw (private mode, blocked cookies) — never let that break the app. */
let storageOk = true
const memory = new Map()
const safeStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k)
    } catch {
      storageOk = false
      return memory.get(k) ?? null
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v)
    } catch {
      storageOk = false
      memory.set(k, v)
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k)
    } catch {
      memory.delete(k)
    }
  },
}
export const isStorageOk = () => storageOk

const initialLang = () => {
  if (typeof navigator === 'undefined') return 'en'
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

let toastId = 0
let resolveConfirm = null

/** Global UI state shared between the DOM and the WebGL layer. */
export const useExperience = create(
  persist(
    (set, get) => ({
      /* ---- boot */
      ready: false,
      introDone: false,
      setReady: () => set({ ready: true }),
      setIntroDone: () => set({ introDone: true }),
      webgl: true,
      setWebgl: (webgl) => set({ webgl }),

      /* ---- appearance */
      paletteId: PALETTES[0].id,
      finishId: FINISHES[0].id,
      customColor: '#9aa0a8',
      setPalette: (paletteId) => set({ paletteId }),
      setFinish: (finishId) => set({ finishId }),
      setCustomColor: (customColor) => set({ customColor, finishId: 'custom' }),
      quality: detectInitialQuality(),
      setQuality: (quality) => set({ quality }),

      /* ---- preferences */
      lang: initialLang(),
      theme: 'dark',
      units: 'us',
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      setUnits: (units) => set({ units }),

      /* ---- panels (only one drawer / modal at a time) */
      panelOpen: false,
      garageOpen: false,
      searchOpen: false,
      helpOpen: false,
      menuOpen: false,
      setPanelOpen: (panelOpen) => set({ panelOpen, garageOpen: false, menuOpen: false }),
      setGarageOpen: (garageOpen) => set({ garageOpen, panelOpen: false, menuOpen: false }),
      setSearchOpen: (searchOpen) => set({ searchOpen, menuOpen: false }),
      setHelpOpen: (helpOpen) => set({ helpOpen, menuOpen: false }),
      setMenuOpen: (menuOpen) => set({ menuOpen }),
      closeAll: () => set({ panelOpen: false, garageOpen: false, searchOpen: false, helpOpen: false, menuOpen: false }),

      /* ---- bookmarks: [{ id, kind, target }] */
      bookmarks: [],
      isBookmarked: (id) => get().bookmarks.some((b) => b.id === id),
      toggleBookmark: (item) => {
        const exists = get().bookmarks.some((b) => b.id === item.id)
        set({ bookmarks: exists ? get().bookmarks.filter((b) => b.id !== item.id) : [...get().bookmarks, { ...item, at: Date.now() }] })
        return !exists
      },
      clearBookmarks: () => set({ bookmarks: [] }),

      /* ---- saved builds: [{ id, name, finishId, paletteId, customColor, at }] */
      builds: [],
      saveBuild: (name) => {
        const s = get()
        const build = { id: `b${Date.now().toString(36)}`, name, finishId: s.finishId, paletteId: s.paletteId, customColor: s.customColor, at: Date.now() }
        set({ builds: [build, ...s.builds].slice(0, 24) })
        return build
      },
      applyBuild: (b) => set({ finishId: b.finishId, paletteId: b.paletteId, customColor: b.customColor ?? get().customColor }),
      deleteBuild: (id) => set({ builds: get().builds.filter((b) => b.id !== id) }),
      restoreBuild: (b) => set({ builds: [b, ...get().builds].sort((x, y) => y.at - x.at) }),

      /* ---- toasts */
      toasts: [],
      notify: (message, opts = {}) => {
        const id = ++toastId
        set({ toasts: [...get().toasts, { id, message, type: opts.type ?? 'info', action: opts.action }].slice(-3) })
        return id
      },
      dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

      /* ---- confirm dialog (promise-based) */
      dialog: null,
      confirm: (opts) =>
        new Promise((resolve) => {
          resolveConfirm?.(false)
          resolveConfirm = resolve
          set({ dialog: opts })
        }),
      resolveDialog: (ok) => {
        resolveConfirm?.(ok)
        resolveConfirm = null
        set({ dialog: null })
      },
    }),
    {
      name: 'cybertruck-3d',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        paletteId: s.paletteId,
        finishId: s.finishId,
        customColor: s.customColor,
        quality: s.quality,
        lang: s.lang,
        theme: s.theme,
        units: s.units,
        bookmarks: s.bookmarks,
        builds: s.builds,
      }),
    },
  ),
)

if (import.meta.env.DEV && typeof window !== 'undefined') window.__experience = useExperience

export const usePalette = () => {
  const id = useExperience((s) => s.paletteId)
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]
}

export const useFinish = () => {
  const id = useExperience((s) => s.finishId)
  const custom = useExperience((s) => s.customColor)
  const f = FINISHES.find((x) => x.id === id) ?? FINISHES[0]
  return id === 'custom' ? { ...f, color: custom } : f
}
