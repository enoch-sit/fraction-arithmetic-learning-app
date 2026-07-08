import { driver } from 'driver.js'
import type { DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import { SHARED_GUIDE_CONTROLS } from '../guides/shared'

interface GuidedTourProps {
  steps: DriveStep[]
}

export default function GuidedTour({ steps }: GuidedTourProps) {
  function startTour() {
    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: SHARED_GUIDE_CONTROLS.navigation.next,
      prevBtnText: SHARED_GUIDE_CONTROLS.navigation.previous,
      doneBtnText: SHARED_GUIDE_CONTROLS.navigation.done,
      progressText: SHARED_GUIDE_CONTROLS.progressTemplate,
      popoverClass: 'math-tour-popover',
      steps,
    })
    driverObj.drive()
  }

  return (
    <button
      className="tour-btn"
      onClick={startTour}
      title={SHARED_GUIDE_CONTROLS.buttonTitle}
      type="button"
      aria-label={SHARED_GUIDE_CONTROLS.buttonAriaLabel}
    >
      {SHARED_GUIDE_CONTROLS.buttonLabel}
    </button>
  )
}
