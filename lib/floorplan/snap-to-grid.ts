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
