import type { MouseEventHandler } from 'react'

export interface PlaybackControlButton {
  id: string
  label: string
  disabled?: boolean
  className?: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  onClickAttr?: string
}

export interface PlaybackControlsPanelProps {
  id?: string
  className?: string
  buttonClassName?: string
  buttons: PlaybackControlButton[]
}

function joinClasses(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(' ')
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default function PlaybackControlsPanel({ id, className, buttonClassName, buttons }: PlaybackControlsPanelProps) {
  return (
    <div id={id} className={joinClasses('playback-controls', className)}>
      {buttons.map((button) => (
        <button
          key={button.id}
          type="button"
          id={button.id}
          className={joinClasses('playback-btn', buttonClassName, button.className)}
          disabled={button.disabled}
          onClick={button.onClick}
        >
          {button.label}
        </button>
      ))}
    </div>
  )
}

export function renderPlaybackControlsPanel({ id, className, buttonClassName, buttons }: PlaybackControlsPanelProps) {
  const panelId = id ? ` id="${escapeHtml(id)}"` : ''
  const panelClass = escapeHtml(joinClasses('playback-controls', className))
  const buttonMarkup = buttons.map((button) => {
    const buttonClasses = escapeHtml(joinClasses('playback-btn', buttonClassName, button.className))
    const disabledAttr = button.disabled ? ' disabled' : ''
    const clickAttr = button.onClickAttr ? ` onclick="${escapeHtml(button.onClickAttr)}"` : ''
    return `<button type="button" id="${escapeHtml(button.id)}" class="${buttonClasses}"${clickAttr}${disabledAttr}>${escapeHtml(button.label)}</button>`
  }).join('')

  return `<div${panelId} class="${panelClass}">${buttonMarkup}</div>`
}
