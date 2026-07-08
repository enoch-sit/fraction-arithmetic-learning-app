export interface PlaybackHistoryEntry {
  undo: () => void
}

export function createPlaybackHistory(onChange?: () => void) {
  const entries: PlaybackHistoryEntry[] = []

  function notify() {
    onChange?.()
  }

  return {
    push(undo: () => void) {
      entries.push({ undo })
      notify()
    },
    stepBack() {
      const entry = entries.pop()
      notify()
      if (!entry) return false
      entry.undo()
      return true
    },
    clear() {
      if (entries.length === 0) return
      entries.length = 0
      notify()
    },
    canStepBack() {
      return entries.length > 0
    },
    size() {
      return entries.length
    },
  }
}
