let distance = 0;
let downAt = { x: 0, y: 0 };

export function trackDown(x: number, y: number) {
  downAt = { x, y };
  distance = 0;
}

export function trackMove(x: number, y: number) {
  distance = Math.max(distance, Math.hypot(x - downAt.x, y - downAt.y));
}

export function wasDrag(threshold = 6) {
  return distance > threshold;
}
