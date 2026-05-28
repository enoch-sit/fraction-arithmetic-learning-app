import type { DriveStep } from 'driver.js'
import { expandingGuideContent } from '../guides/expanding'

export const expandingTourSteps: DriveStep[] = expandingGuideContent.tourSteps.map((step) => ({
  element: step.element,
  popover: {
    title: step.title,
    description: step.description,
    side: step.side,
  },
}))
