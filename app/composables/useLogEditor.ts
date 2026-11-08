export type LogChange = { type: 'update', entry: LogEntry } | { type: 'delete', id: string }

// Client only: the pages that show logs (the feed) hear about a save or a delete, since refreshNuxtData can't target
// the feed's key, which holds its filters.
const listeners = new Set<(change: LogChange) => void>()

// One log edit sheet, mounted in the apartment shell: the toast's « Modifier » and a feed row open the same one, even
// across a page change.
export function useLogEditor() {
  const state = useState<{ entry: LogEntry | null, open: boolean }>('log-editor', () => ({ entry: null, open: false }))

  function open(entry: LogEntry) {
    state.value = { entry, open: true }
  }

  function close() {
    state.value = { ...state.value, open: false }
  }

  // In a component's setup: removed when it unmounts.
  function onChange(listener: (change: LogChange) => void) {
    if (import.meta.server) return
    listeners.add(listener)
    onBeforeUnmount(() => listeners.delete(listener))
  }

  function notify(change: LogChange) {
    for (const listener of listeners) listener(change)
  }

  return { state, open, close, onChange, notify }
}
