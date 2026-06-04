import type { DriveStep } from 'driver.js'
import { intfracconvGuideContent } from '../guides/intfracconv'

export const intfracconvTourSteps: DriveStep[] = intfracconvGuideContent.tourSteps.map((step) => ({
  element: step.element,
  popover: {
    title: step.title,
    description: step.description,
    side: step.side,
  },
}))
