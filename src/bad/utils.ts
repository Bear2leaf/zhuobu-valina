import { vec4 } from "gl-matrix";

export function collision(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) {
    return Math.max(x1, x2) < Math.min(x1 + w1, x2 + w2) && Math.max(y1, y2) < Math.min(y1 + h1, y2 + h2);
}
export function calculateSlope(x1: number, y1: number, x2: number, y2: number, out: { dx: number, dy: number }) {
    const steps = Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
    if (steps === 0) {
        out.dx = 0;
        out.dy = 0;
    } else {
        out.dx = (x1 - x2) / steps;
        out.dy = (y1 - y2) / steps;
    }
}
export function getAngle(x1: number, y1: number, x2: number, y2: number) {
    const angle = -90 + Math.atan2(y1 - y2, x1 - x2) * (180 / Math.PI)
    return angle >= 0 ? angle : 360 + angle;
}
export function getDistance(x1: number, y1: number, x2: number, y2: number) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}
export function normalizeColor(color: vec4) {
    return vec4.fromValues(color[0] / 255, color[1] / 255, color[2] / 255, color[3] / 255);
}