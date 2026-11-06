import { create } from 'zustand'

/**
 * A wallpaper the visitor picks from their own computer. The image stays in
 * this browser (IndexedDB, since photos outgrow localStorage) and is never uploaded.
 */
const DB = 'surajos'
const STORE = 'files'
const KEY = 'user-wallpaper'

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function put(blob: Blob | null) {
  const d = await db()
  await new Promise<void>((resolve, reject) => {
    const tx = d.transaction(STORE, 'readwrite')
    if (blob) tx.objectStore(STORE).put(blob, KEY)
    else tx.objectStore(STORE).delete(KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function get(): Promise<Blob | null> {
  const d = await db()
  return new Promise((resolve, reject) => {
    const req = d.transaction(STORE).objectStore(STORE).get(KEY)
    req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null)
    req.onerror = () => reject(req.error)
  })
}

interface State {
  url: string | null
  load: () => Promise<void>
  choose: (file: File) => Promise<void>
  clear: () => Promise<void>
}

export const useUserWallpaper = create<State>((set, getState) => ({
  url: null,
  load: async () => {
    try {
      const blob = await get()
      if (blob) set({ url: URL.createObjectURL(blob) })
    } catch {
      // Private mode or storage disabled: no saved picture.
    }
  },
  choose: async (file) => {
    const old = getState().url
    set({ url: URL.createObjectURL(file) })
    if (old) URL.revokeObjectURL(old)
    try {
      await put(file)
    } catch {
      // Still shows for this visit even if it cannot be saved.
    }
  },
  clear: async () => {
    const old = getState().url
    if (old) URL.revokeObjectURL(old)
    set({ url: null })
    try {
      await put(null)
    } catch {
      // Nothing saved to clear.
    }
  },
}))
