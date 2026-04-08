/**
 * Snap-to-grid utilities for the floor plan editor
 * Provides functions to align elements to a configurable grid
 */

/**
 * Available grid sizes in pixels
 */
export const GRID_SIZES = [10, 20, 40] as const;
export type GridSize = (typeof GRID_SIZES)[number];

/**
 * Default grid size
 */
export const DEFAULT_GRID_SIZE: GridSize = 20;

/**
 * Snaps a single value to the nearest grid point
 * @param value - The value to snap
 * @param gridSize - The grid size in pixels
 * @returns The snapped value
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snaps a position (x, y) to the nearest grid point
 * @param x - The x coordinate
 * @param y - The y coordinate
 * @param gridSize - The grid size in pixels
 * @returns The snapped position
 */
export function snapPosition(x: number, y: number, gridSize: number): { x: number; y: number } {
  return {
    x: snapToGrid(x, gridSize),
    y: snapToGrid(y, gridSize),
  };
}

/**
 * Snaps a position only if snap is enabled
 * @param x - The x coordinate
 * @param y - The y coordinate
 * @param gridSize - The grid size in pixels
 * @param snapEnabled - Whether snap is enabled
 * @returns The snapped position (or original if snap is disabled)
 */
export function snapPositionIfEnabled(
  x: number,
  y: number,
  gridSize: number,
  snapEnabled: boolean
): { x: number; y: number } {
  if (!snapEnabled) {
    return { x, y };
  }
  return snapPosition(x, y, gridSize);
}

/**
 * Snaps dimensions (width, height) to the grid
 * Ensures minimum dimensions are maintained
 * @param width - The width to snap
 * @param height - The height to snap
 * @param gridSize - The grid size in pixels
 * @param minWidth - Minimum width (default: gridSize)
 * @param minHeight - Minimum height (default: gridSize)
 * @returns The snapped dimensions
 */
export function snapDimensions(
  width: number,
  height: number,
  gridSize: number,
  minWidth: number = gridSize,
  minHeight: number = gridSize
): { width: number; height: number } {
  return {
    width: Math.max(minWidth, snapToGrid(width, gridSize)),
    height: Math.max(minHeight, snapToGrid(height, gridSize)),
  };
}

/**
 * Snap configuration interface
 */
export interface SnapConfig {
  enabled: boolean;
  gridSize: GridSize;
}

/**
 * Default snap configuration
 */
export const DEFAULT_SNAP_CONFIG: SnapConfig = {
  enabled: true,
  gridSize: DEFAULT_GRID_SIZE,
};

/**
 * Represents an element's bounding rectangle for snap calculations
 */
export interface SnapElementRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Result of a snap-to-elements calculation
 */
export interface SnapResult {
  x: number;
  y: number;
  snappedX: boolean;
  snappedY: boolean;
}

/**
 * Snaps a moving element to nearby elements (edge-to-edge, center-to-center, edge-to-center)
 * This has PRIORITY over grid snap when both are active.
 *
 * @param movingElement - The element currently being moved
 * @param otherElements - All other elements on the canvas
 * @param tolerance - Pixel tolerance for snap detection (default: 5)
 * @returns The snapped position and whether snapping occurred on each axis
 */
export function snapToElements(
  movingElement: SnapElementRect,
  otherElements: SnapElementRect[],
  tolerance: number = 5
): SnapResult {
  let bestX = movingElement.x;
  let bestY = movingElement.y;
  let snappedX = false;
  let snappedY = false;
  let bestDistX = tolerance + 1;
  let bestDistY = tolerance + 1;

  const movingLeft = movingElement.x;
  const movingCenterX = movingElement.x + movingElement.width / 2;
  const movingRight = movingElement.x + movingElement.width;
  const movingTop = movingElement.y;
  const movingCenterY = movingElement.y + movingElement.height / 2;
  const movingBottom = movingElement.y + movingElement.height;

  for (const other of otherElements) {
    if (other.id === movingElement.id) continue;

    const refLeft = other.x;
    const refCenterX = other.x + other.width / 2;
    const refRight = other.x + other.width;
    const refTop = other.y;
    const refCenterY = other.y + other.height / 2;
    const refBottom = other.y + other.height;

    // X-axis snap checks: moving edge/center -> ref edge/center
    const xChecks = [
      // left -> left, center, right
      { movingVal: movingLeft, refVal: refLeft, offset: 0 },
      { movingVal: movingLeft, refVal: refCenterX, offset: 0 },
      { movingVal: movingLeft, refVal: refRight, offset: 0 },
      // center -> left, center, right
      { movingVal: movingCenterX, refVal: refLeft, offset: movingElement.width / 2 },
      { movingVal: movingCenterX, refVal: refCenterX, offset: movingElement.width / 2 },
      { movingVal: movingCenterX, refVal: refRight, offset: movingElement.width / 2 },
      // right -> left, center, right
      { movingVal: movingRight, refVal: refLeft, offset: movingElement.width },
      { movingVal: movingRight, refVal: refCenterX, offset: movingElement.width },
      { movingVal: movingRight, refVal: refRight, offset: movingElement.width },
    ];

    for (const check of xChecks) {
      const dist = Math.abs(check.movingVal - check.refVal);
      if (dist <= tolerance && dist < bestDistX) {
        bestDistX = dist;
        bestX = check.refVal - check.offset;
        snappedX = true;
      }
    }

    // Y-axis snap checks: moving edge/center -> ref edge/center
    const yChecks = [
      // top -> top, center, bottom
      { movingVal: movingTop, refVal: refTop, offset: 0 },
      { movingVal: movingTop, refVal: refCenterY, offset: 0 },
      { movingVal: movingTop, refVal: refBottom, offset: 0 },
      // center -> top, center, bottom
      { movingVal: movingCenterY, refVal: refTop, offset: movingElement.height / 2 },
      { movingVal: movingCenterY, refVal: refCenterY, offset: movingElement.height / 2 },
      { movingVal: movingCenterY, refVal: refBottom, offset: movingElement.height / 2 },
      // bottom -> top, center, bottom
      { movingVal: movingBottom, refVal: refTop, offset: movingElement.height },
      { movingVal: movingBottom, refVal: refCenterY, offset: movingElement.height },
      { movingVal: movingBottom, refVal: refBottom, offset: movingElement.height },
    ];

    for (const check of yChecks) {
      const dist = Math.abs(check.movingVal - check.refVal);
      if (dist <= tolerance && dist < bestDistY) {
        bestDistY = dist;
        bestY = check.refVal - check.offset;
        snappedY = true;
      }
    }
  }

  return { x: bestX, y: bestY, snappedX, snappedY };
}
