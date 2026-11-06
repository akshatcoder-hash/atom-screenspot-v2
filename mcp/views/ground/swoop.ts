export type Point = { x: number; y: number };

export const SWOOP_MS = 600;
const MAX_BOW_PX = 140;

function cubic(a: number, b: number, c: number, d: number, t: number): number {
  const v = 1 - t;
  return v * v * v * a + 3 * v * v * t * b + 3 * v * t * t * c + t * t * t * d;
}

// A cubic curve from `from` to `to`, bowed sideways and eased at both ends.
// Reduced motion keeps the same timing and endpoints but drops the bow.
export function swoopPoint(from: Point, to: Point, progress: number, reducedMotion = false): Point {
  const t = Math.min(Math.max(progress, 0), 1);
  const eased = t * t * (3 - 2 * t);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return to;
  const bow = reducedMotion ? 0 : Math.min(distance * 0.28, MAX_BOW_PX);
  const sideways = { x: (-dy / distance) * bow, y: (dx / distance) * bow };
  const c1 = { x: from.x + dx * 0.3 + sideways.x, y: from.y + dy * 0.3 + sideways.y };
  const c2 = { x: to.x - dx * 0.3 + sideways.x, y: to.y - dy * 0.3 + sideways.y };
  return {
    x: cubic(from.x, c1.x, c2.x, to.x, eased),
    y: cubic(from.y, c1.y, c2.y, to.y, eased),
  };
}
