import type { CSSProperties, ReactNode } from 'react'

interface LangBtnProps {
  id?: string
  active?: boolean
  onClick: () => void
  style?: CSSProperties
  children: ReactNode
}

export default function LangBtn({ id, active, onClick, style, children }: LangBtnProps) {
  return (
    <button
      id={id}
      className={`lang-btn${active ? ' btn-active-mode' : ''}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </button>
  )
}
