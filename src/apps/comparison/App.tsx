import { useEffect, useRef, useState } from 'react'
import './app.css'
import AppHeader from '../../shared/components/AppHeader'
import LangBtn from '../../shared/components/LangBtn'

type FractionFormat = 'integer' | 'fraction' | 'mixed'
type FractionField = 'w' | 'n' | 'd'

interface FractionEntry {
  label: string
  format: FractionFormat
  w: number
  n: number
  d: number
}

interface DragState {
  kind: 'width' | 'offset'
  index: number
  startY: number
  initialOffset: number
  boundsLeft: number
  boundsWidth: number
}

interface NumberStepperProps {
  label: string
  value: number
  onChange: (nextValue: number) => void
  compact?: boolean
}

interface FractionInputCardProps {
  entry: FractionEntry
  color: string
  onFormatChange: (nextFormat: FractionFormat) => void
  onFieldChange: (field: FractionField, nextValue: number) => void
}

interface ComparisonRowProps {
  entry: FractionEntry
  color: string
  accentColor: string
  activeColor: string
  widthPercent: number
  verticalOffset: number
  scaleMax: number
  showNumberLine: boolean
  showMismatch: boolean
  dragging: boolean
  isSyncMode: boolean
  onWidthPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
  onOffsetPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void
}

const COLORS = ['var(--primary)', 'var(--accent)', 'var(--success)']

const DEFAULT_ENTRIES: FractionEntry[] = [
  { label: 'A', format: 'fraction', w: 1, n: 1, d: 2 },
  { label: 'B', format: 'fraction', w: 1, n: 3, d: 4 },
  { label: 'C', format: 'mixed', w: 1, n: 1, d: 2 },
]

function clampInputValue(value: number) {
  if (Number.isNaN(value)) return 1
  return Math.min(99, Math.max(1, Math.round(value)))
}

function snapWidth(percent: number, index: number, widths: number[], activeCount: number) {
  const snapThreshold = 3
  let nextPercent = Math.min(100, Math.max(5, percent))

  if (Math.abs(nextPercent - 100) < snapThreshold) nextPercent = 100

  for (let candidateIndex = 0; candidateIndex < activeCount; candidateIndex += 1) {
    if (candidateIndex === index) continue
    if (Math.abs(nextPercent - widths[candidateIndex]) < snapThreshold) {
      nextPercent = widths[candidateIndex]
      break
    }
  }

  return nextPercent
}

function getEntryValue(entry: FractionEntry) {
  if (entry.format === 'integer') return entry.w
  if (entry.format === 'fraction') return entry.n / entry.d
  return entry.w + (entry.n / entry.d)
}

function getEntryDenominator(entry: FractionEntry) {
  return entry.format === 'integer' ? 1 : entry.d
}

function formatComparisonValue(value: number) {
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(2).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
}

function getComparisonSummary(entries: FractionEntry[]) {
  const rows = entries.map((entry) => ({
    label: entry.label,
    value: getEntryValue(entry),
  }))

  rows.sort((left, right) => left.value - right.value)

  const parts: string[] = []
  rows.forEach((row, index) => {
    if (index > 0) {
      const previous = rows[index - 1]
      parts.push(Math.abs(row.value - previous.value) < 0.0001 ? '=' : '<')
    }
    parts.push(`${row.label} (${formatComparisonValue(row.value)})`)
  })

  return parts.join(' ')
}

function FractionDisplay({ entry }: { entry: FractionEntry }) {
  if (entry.format === 'integer') {
    return <span className="comparison-integer">{entry.w}</span>
  }

  if (entry.format === 'fraction') {
    return (
      <span className="comparison-frac">
        <span className="comparison-frac-num">{entry.n}</span>
        <span className="comparison-frac-den">{entry.d}</span>
      </span>
    )
  }

  return (
    <span className="comparison-mixed">
      <span className="comparison-integer">{entry.w}</span>
      <span className="comparison-frac">
        <span className="comparison-frac-num">{entry.n}</span>
        <span className="comparison-frac-den">{entry.d}</span>
      </span>
    </span>
  )
}

function NumberStepper({ label, value, onChange, compact }: NumberStepperProps) {
  const className = compact ? 'comparison-stepper compact' : 'comparison-stepper'

  return (
    <label className={className}>
      <span className="comparison-stepper-label">{label}</span>
      <div className="comparison-stepper-frame">
        <input
          type="number"
          min={1}
          max={99}
          value={value}
          inputMode="numeric"
          onChange={(event) => onChange(clampInputValue(Number(event.target.value)))}
        />
        <div className="comparison-stepper-buttons">
          <button type="button" onClick={() => onChange(clampInputValue(value + 1))} aria-label={`${label} increase`}>
            ▲
          </button>
          <button type="button" onClick={() => onChange(clampInputValue(value - 1))} aria-label={`${label} decrease`}>
            ▼
          </button>
        </div>
      </div>
    </label>
  )
}

function FractionInputCard({ entry, color, onFormatChange, onFieldChange }: FractionInputCardProps) {
  return (
    <section className="fraction-input-card" style={{ borderColor: color }}>
      <div className="fraction-card-topline">
        <span className="fraction-card-tag" style={{ background: color }}>{entry.label}</span>
        <select
          className="fraction-format-select"
          value={entry.format}
          title={`switch format for fraction ${entry.label}`}
          onChange={(event) => onFormatChange(event.target.value as FractionFormat)}
        >
          <option value="integer">整數</option>
          <option value="fraction">分數</option>
          <option value="mixed">帶分數</option>
        </select>
      </div>

      <div className="fraction-card-preview" style={{ color }}>
        <FractionDisplay entry={entry} />
      </div>

      {entry.format === 'integer' ? (
        <div className="fraction-card-fields single-field">
          <NumberStepper label="整數" value={entry.w} onChange={(nextValue) => onFieldChange('w', nextValue)} compact />
        </div>
      ) : null}

      {entry.format === 'fraction' ? (
        <div className="fraction-card-fields fraction-only">
          <NumberStepper label="分子" value={entry.n} onChange={(nextValue) => onFieldChange('n', nextValue)} compact />
          <NumberStepper label="分母" value={entry.d} onChange={(nextValue) => onFieldChange('d', nextValue)} compact />
        </div>
      ) : null}

      {entry.format === 'mixed' ? (
        <div className="fraction-card-fields mixed-fields">
          <NumberStepper label="整數" value={entry.w} onChange={(nextValue) => onFieldChange('w', nextValue)} compact />
          <NumberStepper label="分子" value={entry.n} onChange={(nextValue) => onFieldChange('n', nextValue)} compact />
          <NumberStepper label="分母" value={entry.d} onChange={(nextValue) => onFieldChange('d', nextValue)} compact />
        </div>
      ) : null}
    </section>
  )
}

function NumberLine({ scaleMax, denominator }: { scaleMax: number; denominator: number }) {
  const totalTicks = scaleMax * denominator
  const ticks = []

  for (let tickIndex = 0; tickIndex <= totalTicks; tickIndex += 1) {
    const left = `${(tickIndex / totalTicks) * 100}%`
    const isMajor = tickIndex % denominator === 0
    const whole = Math.floor(tickIndex / denominator)
    const rest = tickIndex % denominator

    ticks.push(
      <div key={`${denominator}-${tickIndex}`} className="comparison-line-tick" style={{ left }}>
        <div className={`comparison-line-mark${isMajor ? ' major' : ''}`} />
        <div className="comparison-line-label">
          {isMajor ? (
            <span>{whole}</span>
          ) : whole === 0 ? (
            <span className="comparison-line-frac">
              <span>{rest}</span>
              <span>{denominator}</span>
            </span>
          ) : (
            <span className="comparison-line-mixed">
              <span>{whole}</span>
              <span className="comparison-line-frac">
                <span>{rest}</span>
                <span>{denominator}</span>
              </span>
            </span>
          )}
        </div>
      </div>,
    )
  }

  return (
    <div className="comparison-line-shell">
      <div className="comparison-line-track" />
      {ticks}
    </div>
  )
}

function ComparisonRow({
  entry,
  color,
  accentColor,
  activeColor,
  widthPercent,
  verticalOffset,
  scaleMax,
  showNumberLine,
  showMismatch,
  dragging,
  isSyncMode,
  onWidthPointerDown,
  onOffsetPointerDown,
}: ComparisonRowProps) {
  const denominator = getEntryDenominator(entry)
  const entryValue = getEntryValue(entry)
  const fillPercent = Math.min(100, (entryValue / scaleMax) * 100)
  const totalSegments = scaleMax * denominator
  const rowStyle = {
    transform: `translateY(${verticalOffset}px)`,
    zIndex: dragging ? 4 : 1,
  }

  const segmentDividers = []
  for (let segmentIndex = 1; segmentIndex < totalSegments; segmentIndex += 1) {
    const left = `${(segmentIndex / totalSegments) * 100}%`
    const major = segmentIndex % denominator === 0
    segmentDividers.push(
      <div
        key={`${entry.label}-${segmentIndex}`}
        className={`comparison-segment-divider${major ? ' major' : ''}`}
        style={{ left }}
      />,
    )
  }

  return (
    <article className={`comparison-row${dragging ? ' dragging' : ''}`} style={rowStyle}>
      <div className="comparison-row-header" style={{ color: activeColor }}>
        <div className="comparison-row-title-wrap">
          <span className="comparison-row-dot" style={{ background: accentColor }} />
          <span className="comparison-row-title">分數 {entry.label}</span>
          <FractionDisplay entry={entry} />
        </div>
        {!isSyncMode ? (
          <button className="comparison-offset-handle" type="button" onPointerDown={onOffsetPointerDown}>
            上下移動
          </button>
        ) : null}
      </div>

      <div className="comparison-track-wrap">
        <div className="comparison-track">
          <div
            className={`comparison-bar${!isSyncMode ? ' interactive' : ''}${showMismatch ? ' mismatch' : ''}`}
            style={{ width: `${widthPercent}%`, borderColor: showMismatch ? 'var(--red)' : accentColor }}
            onPointerDown={onWidthPointerDown}
          >
            <div className="comparison-bar-fill" style={{ width: `${fillPercent}%`, background: color }} />
            <div className="comparison-grid-overlay">{segmentDividers}</div>
          </div>
        </div>
        {showNumberLine ? (
          <div className="comparison-number-line-wrap" style={{ width: `${widthPercent}%` }}>
            <NumberLine scaleMax={scaleMax} denominator={denominator} />
          </div>
        ) : null}
      </div>
    </article>
  )
}

export default function App() {
  const [entries, setEntries] = useState(DEFAULT_ENTRIES)
  const [activeCount, setActiveCount] = useState(2)
  const [showNumberLine, setShowNumberLine] = useState(false)
  const [isSyncMode, setIsSyncMode] = useState(true)
  const [containerWidths, setContainerWidths] = useState([100, 100, 100])
  const [verticalOffsets, setVerticalOffsets] = useState([0, 0, 0])
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const dragStateRef = useRef<DragState | null>(null)

  const visibleEntries = entries.slice(0, activeCount)
  const visibleWidths = containerWidths.slice(0, activeCount)
  const widthsMatch = visibleWidths.every((width) => Math.abs(width - visibleWidths[0]) <= 0.5)
  let scaleMax = 1
  visibleEntries.forEach((entry) => {
    scaleMax = Math.max(scaleMax, Math.ceil(getEntryValue(entry)))
  })

  useEffect(() => {
    if (!isSyncMode) return
    setContainerWidths((currentWidths) => currentWidths.map((width, index) => (index < activeCount ? 100 : width)))
    setVerticalOffsets((currentOffsets) => currentOffsets.map((offset, index) => (index < activeCount ? 0 : offset)))
  }, [activeCount, isSyncMode])

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const drag = dragStateRef.current
      if (!drag) return

      if (drag.kind === 'width') {
        const rawPercent = ((event.clientX - drag.boundsLeft) / drag.boundsWidth) * 100
        setContainerWidths((currentWidths) => {
          const nextWidths = [...currentWidths]
          nextWidths[drag.index] = snapWidth(rawPercent, drag.index, currentWidths, activeCount)
          return nextWidths
        })
      } else {
        const deltaY = event.clientY - drag.startY
        setVerticalOffsets((currentOffsets) => {
          const nextOffsets = [...currentOffsets]
          nextOffsets[drag.index] = drag.initialOffset + deltaY
          return nextOffsets
        })
      }

      event.preventDefault()
    }

    function handlePointerUp() {
      dragStateRef.current = null
      setDraggingIndex(null)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: false })
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [activeCount])

  function updateEntryField(index: number, field: FractionField, nextValue: number) {
    setEntries((currentEntries) => currentEntries.map((entry, entryIndex) => {
      if (entryIndex !== index) return entry
      return { ...entry, [field]: clampInputValue(nextValue) }
    }))
  }

  function updateEntryFormat(index: number, nextFormat: FractionFormat) {
    setEntries((currentEntries) => currentEntries.map((entry, entryIndex) => {
      if (entryIndex !== index) return entry
      if (nextFormat === 'integer') return { ...entry, format: nextFormat, n: 1, d: 1 }
      if (nextFormat === 'fraction') return { ...entry, format: nextFormat, w: 1 }
      return { ...entry, format: nextFormat }
    }))
  }

  function toggleMode() {
    setIsSyncMode((currentMode) => {
      const nextMode = !currentMode
      if (nextMode) {
        setContainerWidths([100, 100, 100])
        setVerticalOffsets([0, 0, 0])
      }
      return nextMode
    })
  }

  function randomizeWidths() {
    if (isSyncMode) return
    setContainerWidths((currentWidths) => currentWidths.map((width, index) => (
      index < activeCount ? Math.round((30 + Math.random() * 60) * 10) / 10 : width
    )))
  }

  function matchWidths() {
    if (isSyncMode) return
    setContainerWidths((currentWidths) => currentWidths.map((width, index) => (index < activeCount ? 100 : width)))
  }

  function handleWidthPointerDown(index: number, event: React.PointerEvent<HTMLDivElement>) {
    if (isSyncMode) return
    const trackElement = event.currentTarget.parentElement
    if (!trackElement) return
    const bounds = trackElement.getBoundingClientRect()
    if (bounds.width <= 0) return

    dragStateRef.current = {
      kind: 'width',
      index,
      startY: event.clientY,
      initialOffset: verticalOffsets[index],
      boundsLeft: bounds.left,
      boundsWidth: bounds.width,
    }
    setDraggingIndex(index)
  }

  function handleOffsetPointerDown(index: number, event: React.PointerEvent<HTMLButtonElement>) {
    if (isSyncMode) return
    const viewportWidth = window.innerWidth || 1
    dragStateRef.current = {
      kind: 'offset',
      index,
      startY: event.clientY,
      initialOffset: verticalOffsets[index],
      boundsLeft: 0,
      boundsWidth: viewportWidth,
    }
    setDraggingIndex(index)
  }

  return (
    <div className="container comparison-app-shell">
      <AppHeader
        leftSlot={<div className="title-badge">分數比較</div>}
        rightSlot={(
          <div className="comparison-toolbar-inline">
            <label className="comparison-select-label">
              <span>比較數量</span>
              <select value={activeCount} onChange={(event) => setActiveCount(Number(event.target.value))}>
                <option value={2}>比較 2 個分數</option>
                <option value={3}>比較 3 個分數</option>
              </select>
            </label>
            <LangBtn active={isSyncMode} onClick={toggleMode}>{isSyncMode ? '模式1' : '模式2'}</LangBtn>
          </div>
        )}
      />

      <section className="comparison-toolbar-panel">
        <div className="comparison-control-group">
          <label className="comparison-checkbox">
            <input
              type="checkbox"
              checked={showNumberLine}
              onChange={(event) => setShowNumberLine(event.target.checked)}
            />
            <span>顯示數線</span>
          </label>
          <span className="comparison-mode-copy">
            {isSyncMode
              ? '模式1：所有長條維持同一整體長度，直接比較分數值。'
              : '模式2：可調整長條整體長度並上下移動，先對齊長度再比較大小。'}
          </span>
        </div>

        {!isSyncMode ? (
          <div className="comparison-control-group quick-actions">
            <LangBtn onClick={randomizeWidths}>隨機長度</LangBtn>
            <LangBtn onClick={matchWidths}>設定同一長度</LangBtn>
          </div>
        ) : null}
      </section>

      <section className="comparison-input-grid">
        {visibleEntries.map((entry, index) => (
          <FractionInputCard
            key={entry.label}
            entry={entry}
            color={COLORS[index]}
            onFormatChange={(nextFormat) => updateEntryFormat(index, nextFormat)}
            onFieldChange={(field, nextValue) => updateEntryField(index, field, nextValue)}
          />
        ))}
      </section>

      <section className="comparison-summary-panel">
        <div className="comparison-summary-title">目前排序</div>
        <div className="comparison-summary-copy">{getComparisonSummary(visibleEntries)}</div>
        {!isSyncMode && !widthsMatch ? (
          <div className="comparison-warning">⚠️ 長條圖整體長度不一致，請先拖曳到相同長度再比較。</div>
        ) : null}
      </section>

      <section className="comparison-visual-stack">
        {visibleEntries.map((entry, index) => {
          const showMismatch = !isSyncMode && !widthsMatch
          const activeColor = showMismatch ? 'var(--gray)' : COLORS[index]
          return (
            <ComparisonRow
              key={entry.label}
              entry={entry}
              color={showMismatch ? 'var(--gray)' : COLORS[index]}
              accentColor={COLORS[index]}
              activeColor={activeColor}
              widthPercent={isSyncMode ? 100 : containerWidths[index]}
              verticalOffset={isSyncMode ? 0 : verticalOffsets[index]}
              scaleMax={scaleMax}
              showNumberLine={showNumberLine}
              showMismatch={showMismatch}
              dragging={draggingIndex === index}
              isSyncMode={isSyncMode}
              onWidthPointerDown={(event) => handleWidthPointerDown(index, event)}
              onOffsetPointerDown={(event) => handleOffsetPointerDown(index, event)}
            />
          )
        })}
      </section>
    </div>
  )
}