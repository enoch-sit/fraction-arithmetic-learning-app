import type { DriveStep } from 'driver.js'
import { additionGuideContent } from '../guides/addition'

export const additionTourSteps: DriveStep[] = additionGuideContent.tourSteps.map((step) => ({
  element: step.element,
  popover: {
    title: step.title,
    description: step.description,
    side: step.side,
  },
}))
