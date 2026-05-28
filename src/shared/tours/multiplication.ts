import type { DriveStep } from 'driver.js'
import { multiplicationGuideContent } from '../guides/multiplication'

export const multiplicationTourSteps: DriveStep[] = multiplicationGuideContent.tourSteps.map((step) => ({
  element: step.element,
  popover: {
    title: step.title,
    description: step.description,
    side: step.side,
  },
}))
