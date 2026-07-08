import type { DriveStep } from 'driver.js'
import { divisionGuideContent } from '../guides/division'

export const divisionTourSteps: DriveStep[] = divisionGuideContent.tourSteps.map((step) => ({
  element: step.element,
  popover: {
    title: step.title,
    description: step.description,
    side: step.side,
  },
}))
