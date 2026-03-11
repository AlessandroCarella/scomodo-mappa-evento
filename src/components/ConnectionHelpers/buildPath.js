import { CONNECTION_ARC_FACTOR } from "../../config";

/**
 * buildPath
 *
 * Returns the SVG `d` attribute string and the approximate path length
 * for a connection between two SVG-space points.
 *
 * @param {{ x: number, y: number }} from
 * @param {{ x: number, y: number }} to
 * @param {"arc" | "line"}           shape
 *
 * @returns {{ d: string, arcLen: number }}
 */
export function buildPath(from, to, shape) {
  const dx  = to.x - from.x;
  const dy  = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  if (shape === "arc") {
    const cx = (from.x + to.x) / 2 - dy * CONNECTION_ARC_FACTOR;
    const cy = (from.y + to.y) / 2 + dx * CONNECTION_ARC_FACTOR;
    return {
      d:      `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`,
      arcLen: len * 1.12, // Bézier is slightly longer than straight distance
    };
  }

  return {
    d:      `M ${from.x} ${from.y} L ${to.x} ${to.y}`,
    arcLen: len,
  };
}
