interface ActionBtn {
  id: string
  label: string
  onClick: () => void
  disabled?: boolean
}

interface ActionButtonRowProps {
  primary: ActionBtn   // rendered as btn-merge (green)
  secondary: ActionBtn // rendered as btn-slice (yellow)
}

export default function ActionButtonRow({ primary, secondary }: ActionButtonRowProps) {
  return (
    <div className="control-panel">
      <button 
        id={primary.id} 
        className="action-btn btn-merge" 
        onClick={primary.onClick}
        disabled={primary.disabled}
      >
        {primary.label}
      </button>
      <button 
        id={secondary.id} 
        className="action-btn btn-slice" 
        onClick={secondary.onClick}
        disabled={secondary.disabled}
      >
        {secondary.label}
      </button>
    </div>
  )
}
