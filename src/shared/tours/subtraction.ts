import type { DriveStep } from 'driver.js'
import { subtractionGuideContent } from '../guides/subtraction'

export const subtractionTourSteps: DriveStep[] = subtractionGuideContent.tourSteps.map((step) => ({
  element: step.element,
  popover: {
    title: step.title,
    description: step.description,
    side: step.side,
  },
}))
