import type { ReactNode } from 'react'

interface AppHeaderProps {
  leftSlot: ReactNode
  rightSlot: ReactNode
}

export default function AppHeader({ leftSlot, rightSlot }: AppHeaderProps) {
  return (
    <div className="header">
      <div className="header-left">{leftSlot}</div>
      <div className="header-right">{rightSlot}</div>
    </div>
  )
}
