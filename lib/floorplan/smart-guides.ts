/**
 * Smart guides detection for the floor plan editor
 * Detects alignment between a moving element and other elements on the canvas
 */

/**
 * Represents the bounding rect of an element on the canvas
 */
export interface ElementRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Represents a detected alignment guide line
 */
export interface AlignmentGuide {
  type: "horizontal" | "vertical";
  /** Y position for horizontal guides, X position for vertical guides */
  position: number;
  /** ID of the element that caused the alignment */
  fromElement: string;
  /** Which edge/center caused the alignment */
  alignType: "left" | "center-x" | "right" | "top" | "center-y" | "bottom";
}

/** Default tolerance in pixels for alignment detection */
export const GUIDE_TOLERANCE = 5;

/** Guide colors */
export const GUIDE_COLOR_EDGE = "#00D4FF";
export const GUIDE_COLOR_CENTER = "#FF00FF";

/**
 * Extracts the 6 alignment reference points from an element rect
 */
function getAlignmentPoints(rect: ElementRect) {
  return {
    left: rect.x,
    centerX: rect.x + rect.width / 2,
    right: rect.x + rect.width,
    top: rect.y,
    centerY: rect.y + rect.height / 2,
    bottom: rect.y + rect.height,
  };
}

/**
 * Detects alignment guides between a moving element and other elements
 *
 * Compares the 6 alignment points (left, center-x, right, top, center-y, bottom)
 * of the moving element against those of every other element.
 *
 * @param movingElement - The element currently being dragged
 * @param otherElements - All other elements on the canvas
 * @param tolerance - Pixel tolerance for alignment detection (default: 5)
 * @returns Array of active alignment guides
 */
export function detectAlignmentGuides(
  movingElement: ElementRect,
  otherElements: ElementRect[],
  tolerance: number = GUIDE_TOLERANCE
): AlignmentGuide[] {
  const guides: AlignmentGuide[] = [];
  const moving = getAlignmentPoints(movingElement);

  // Track unique guide positions to avoid duplicates
  const seenVertical = new Set<string>();
  const seenHorizontal = new Set<string>();

  for (const other of otherElements) {
    if (other.id === movingElement.id) continue;

    const ref = getAlignmentPoints(other);

    // Vertical guides (X-axis alignment)
    const verticalChecks: Array<{
      movingVal: number;
      refVal: number;
      alignType: AlignmentGuide["alignType"];
    }> = [
      { movingVal: moving.left, refVal: ref.left, alignType: "left" },
      { movingVal: moving.left, refVal: ref.centerX, alignType: "center-x" },
      { movingVal: moving.left, refVal: ref.right, alignType: "right" },
      { movingVal: moving.centerX, refVal: ref.left, alignType: "left" },
      { movingVal: moving.centerX, refVal: ref.centerX, alignType: "center-x" },
      { movingVal: moving.centerX, refVal: ref.right, alignType: "right" },
      { movingVal: moving.right, refVal: ref.left, alignType: "left" },
      { movingVal: moving.right, refVal: ref.centerX, alignType: "center-x" },
      { movingVal: moving.right, refVal: ref.right, alignType: "right" },
    ];

    for (const check of verticalChecks) {
      if (Math.abs(check.movingVal - check.refVal) <= tolerance) {
        const key = `v-${Math.round(check.refVal)}-${check.alignType}`;
        if (!seenVertical.has(key)) {
          seenVertical.add(key);
          guides.push({
            type: "vertical",
            position: check.refVal,
            fromElement: other.id,
            alignType: check.alignType,
          });
        }
      }
    }

    // Horizontal guides (Y-axis alignment)
    const horizontalChecks: Array<{
      movingVal: number;
      refVal: number;
      alignType: AlignmentGuide["alignType"];
    }> = [
      { movingVal: moving.top, refVal: ref.top, alignType: "top" },
      { movingVal: moving.top, refVal: ref.centerY, alignType: "center-y" },
      { movingVal: moving.top, refVal: ref.bottom, alignType: "bottom" },
      { movingVal: moving.centerY, refVal: ref.top, alignType: "top" },
      { movingVal: moving.centerY, refVal: ref.centerY, alignType: "center-y" },
      { movingVal: moving.centerY, refVal: ref.bottom, alignType: "bottom" },
      { movingVal: moving.bottom, refVal: ref.top, alignType: "top" },
      { movingVal: moving.bottom, refVal: ref.centerY, alignType: "center-y" },
      { movingVal: moving.bottom, refVal: ref.bottom, alignType: "bottom" },
    ];

    for (const check of horizontalChecks) {
      if (Math.abs(check.movingVal - check.refVal) <= tolerance) {
        const key = `h-${Math.round(check.refVal)}-${check.alignType}`;
        if (!seenHorizontal.has(key)) {
          seenHorizontal.add(key);
          guides.push({
            type: "horizontal",
            position: check.refVal,
            fromElement: other.id,
            alignType: check.alignType,
          });
        }
      }
    }
  }

  return guides;
}
