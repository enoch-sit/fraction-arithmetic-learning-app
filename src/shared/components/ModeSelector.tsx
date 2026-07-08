import { useEffect } from 'react'

interface ModeSelectorProps {
  visible: boolean
  x: number              // Menu position X
  y: number              // Menu position Y
  onSelect: (mode: 'whole' | 'fraction' | 'mixed') => void
  onClose: () => void
}

export default function ModeSelector({ visible, x, y, onSelect, onClose }: ModeSelectorProps) {
  useEffect(() => {
    if (visible) {
      const handleClick = () => onClose()
      window.addEventListener('click', handleClick)
      return () => window.removeEventListener('click', handleClick)
    }
  }, [visible, onClose])

  if (!visible) return null

  return (
    <div
      style={{
        display: 'block',
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        background: 'white',
        border: '1px solid #ccc',
        boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
        zIndex: 1000,
        borderRadius: '4px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        onClick={() => {
          onSelect('whole')
          onClose()
        }}
        style={{
          padding: '10px 20px',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        整數
      </div>
      <div
        onClick={() => {
          onSelect('fraction')
          onClose()
        }}
        style={{
          padding: '10px 20px',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        分數
      </div>
      <div
        onClick={() => {
          onSelect('mixed')
          onClose()
        }}
        style={{
          padding: '10px 20px',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        帶分數
      </div>
    </div>
  )
}
