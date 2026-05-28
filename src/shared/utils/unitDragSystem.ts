/**
 * Unit Drag System
 * Enables unit-by-unit dragging between fraction bars
 */

export interface DragUnitConfig {
  sourceBarNum: number // 1 or 2
  unitIndex: number
  unitValue: number // fraction value (e.g., 1/6)
  color: string // var(--red) or var(--blue)
}

export interface DropZoneConfig {
  barNum: number
  canAccept: boolean
  callback: (unit: DragUnitConfig) => void
}

export class UnitDragSystem {
  private draggedUnit: DragUnitConfig | null = null
  private dropZones: Map<number, DropZoneConfig> = new Map()

  registerDropZone(barNum: number, config: DropZoneConfig): void {
    this.dropZones.set(barNum, config)
  }

  setDraggedUnit(unit: DragUnitConfig | null): void {
    this.draggedUnit = unit
  }

  getDraggedUnit(): DragUnitConfig | null {
    return this.draggedUnit
  }

  canDropOnBar(barNum: number): boolean {
    const zone = this.dropZones.get(barNum)
    return zone ? zone.canAccept : false
  }

  dropOnBar(barNum: number): void {
    if (!this.draggedUnit) return
    const zone = this.dropZones.get(barNum)
    if (zone && zone.canAccept) {
      zone.callback(this.draggedUnit)
      this.draggedUnit = null
    }
  }

  reset(): void {
    this.draggedUnit = null
    this.dropZones.clear()
  }
}

export const createUnitDragSystem = (): UnitDragSystem => {
  return new UnitDragSystem()
}
