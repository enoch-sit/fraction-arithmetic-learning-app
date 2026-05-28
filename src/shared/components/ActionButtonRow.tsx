interface ActionBtn {
  id: string
  label: string
  onClick: () => void
}

interface ActionButtonRowProps {
  primary: ActionBtn   // rendered as btn-merge (green)
  secondary: ActionBtn // rendered as btn-slice (yellow)
}

export default function ActionButtonRow({ primary, secondary }: ActionButtonRowProps) {
  return (
    <div className="control-panel">
      <button id={primary.id} className="action-btn btn-merge" onClick={primary.onClick}>
        {primary.label}
      </button>
      <button id={secondary.id} className="action-btn btn-slice" onClick={secondary.onClick}>
        {secondary.label}
      </button>
    </div>
  )
}
