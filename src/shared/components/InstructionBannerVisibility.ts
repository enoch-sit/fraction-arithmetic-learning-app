type InstructionBannerVisibilityOptions = {
  elementId: string
  hiddenMessages: string[]
}

function normalizeInstructionText(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

export function observeInstructionBannerVisibility({
  elementId,
  hiddenMessages,
}: InstructionBannerVisibilityOptions) {
  if (typeof window === 'undefined') return () => {}

  const banner = document.getElementById(elementId)
  if (!banner) return () => {}

  const hiddenSet = new Set(hiddenMessages.map(normalizeInstructionText))

  const syncVisibility = () => {
    const currentText = normalizeInstructionText(banner.textContent || '')
    banner.classList.toggle('instruction-text-hidden', hiddenSet.has(currentText))
  }

  syncVisibility()

  const observer = new MutationObserver(syncVisibility)
  observer.observe(banner, {
    childList: true,
    subtree: true,
    characterData: true,
  })

  return () => observer.disconnect()
}