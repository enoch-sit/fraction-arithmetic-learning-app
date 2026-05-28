import { useEffect, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import './TutorialFingerOverlay.css'

type CSSLength = number | string
type AnimationVariant = 'click' | 'pulse' | 'float' | 'none'
type PositionMode = 'absolute' | 'fixed' | 'relative' | 'sticky'
type HorizontalAnchor = 'left' | 'center' | 'right'
type VerticalAnchor = 'top' | 'center' | 'bottom'
type TargetLike = string | HTMLElement | RefObject<HTMLElement | null>

interface TutorialFingerOverlayProps {
  left?: CSSLength
  top?: CSSLength
  right?: CSSLength
  bottom?: CSSLength
  position?: PositionMode
  visible?: boolean
  clicking?: boolean
  icon?: ReactNode
  className?: string
  size?: CSSLength
  zIndex?: number
  ariaLabel?: string
  target?: TargetLike
  offsetX?: number
  offsetY?: number
  horizontalAnchor?: HorizontalAnchor
  verticalAnchor?: VerticalAnchor
  animationVariant?: AnimationVariant
}

function toCssLength(value: CSSLength | undefined) {
  if (value === undefined) return undefined
  return typeof value === 'number' ? `${value}px` : value
}

function applyStyle(
  element: HTMLDivElement,
  property: 'left' | 'top' | 'right' | 'bottom' | 'font-size' | 'z-index' | 'position',
  value: string | undefined,
) {
  if (value === undefined) {
    element.style.removeProperty(property)
    return
  }

  element.style.setProperty(property, value)
}

function resolveTarget(target: TargetLike | undefined) {
  if (!target || typeof document === 'undefined') return null

  if (typeof target === 'string') {
    return document.querySelector<HTMLElement>(target)
  }

  if ('current' in target) {
    return target.current
  }

  return target
}

function getAnchoredPoint(
  rect: DOMRect,
  horizontalAnchor: HorizontalAnchor,
  verticalAnchor: VerticalAnchor,
) {
  const x =
    horizontalAnchor === 'left'
      ? rect.left
      : horizontalAnchor === 'right'
        ? rect.right
        : rect.left + rect.width / 2

  const y =
    verticalAnchor === 'top'
      ? rect.top
      : verticalAnchor === 'bottom'
        ? rect.bottom
        : rect.top + rect.height / 2

  return { x, y }
}

export default function TutorialFingerOverlay({
  left,
  top,
  right,
  bottom,
  position = 'absolute',
  visible = false,
  clicking = true,
  icon = '👆',
  className = '',
  size,
  zIndex,
  ariaLabel = 'tutorial finger overlay',
  target,
  offsetX = 0,
  offsetY = 0,
  horizontalAnchor = 'center',
  verticalAnchor = 'center',
  animationVariant = 'click',
}: TutorialFingerOverlayProps) {
  const fingerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!fingerRef.current) return

    const currentFinger = fingerRef.current

    applyStyle(fingerRef.current, 'position', position)
    applyStyle(fingerRef.current, 'right', toCssLength(right))
    applyStyle(fingerRef.current, 'bottom', toCssLength(bottom))
    applyStyle(fingerRef.current, 'font-size', toCssLength(size))
    applyStyle(fingerRef.current, 'z-index', zIndex?.toString())

    if (!target) {
      applyStyle(currentFinger, 'left', toCssLength(left))
      applyStyle(currentFinger, 'top', toCssLength(top))
      return
    }

    const updateTargetPosition = () => {
      const targetElement = resolveTarget(target)
      if (!targetElement) return

      const rect = targetElement.getBoundingClientRect()
      const point = getAnchoredPoint(rect, horizontalAnchor, verticalAnchor)
      const x = point.x + offsetX + (position === 'absolute' ? window.scrollX : 0)
      const y = point.y + offsetY + (position === 'absolute' ? window.scrollY : 0)

      currentFinger.style.left = `${x}px`
      currentFinger.style.top = `${y}px`
    }

    updateTargetPosition()

    window.addEventListener('resize', updateTargetPosition)
    window.addEventListener('scroll', updateTargetPosition, true)

    return () => {
      window.removeEventListener('resize', updateTargetPosition)
      window.removeEventListener('scroll', updateTargetPosition, true)
    }
  }, [
    bottom,
    horizontalAnchor,
    left,
    offsetX,
    offsetY,
    position,
    right,
    size,
    target,
    top,
    verticalAnchor,
    zIndex,
  ])

  const classes = [
    'tutorial-finger',
    visible ? 'tutorial-finger-visible' : '',
    clicking && animationVariant !== 'none'
      ? `tutorial-finger-${animationVariant}`
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div aria-label={ariaLabel} aria-hidden="true" className={classes} ref={fingerRef}>
      {icon}
    </div>
  )
}