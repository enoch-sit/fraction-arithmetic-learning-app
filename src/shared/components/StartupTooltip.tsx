import { useEffect } from 'react'
import { showLightGuideHint } from './LightGuideHint'
import type { StartupTooltipContent } from '../guides/shared'

interface StartupTooltipProps {
  content: StartupTooltipContent
}

export default function StartupTooltip({ content }: StartupTooltipProps) {
  useEffect(() => {
    return showLightGuideHint({
      id: content.id,
      element: content.element,
      title: content.title,
      description: content.description,
      side: content.side,
      displayMode: content.displayMode,
      delayMs: content.delayMs,
    })
  }, [content])

  return null
}
