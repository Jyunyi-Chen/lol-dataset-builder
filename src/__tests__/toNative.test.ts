import { describe, it, expect } from 'vitest';

// Mirrors the toNative function in AnnotationCanvas.tsx
function toNative(
  x: number, y: number, w: number, h: number,
  scale: number, imgW: number, imgH: number
) {
  const nx = Math.max(0, Math.min(x / scale, imgW));
  const ny = Math.max(0, Math.min(y / scale, imgH));
  return {
    x: nx,
    y: ny,
    width: Math.min(w / scale, imgW - nx),
    height: Math.min(h / scale, imgH - ny),
  };
}

const IMG = { w: 1920, h: 1080 };
const SCALE = 0.5; // display is half native size

describe('toNative — happy path', () => {
  it('converts display pixels to native pixels correctly', () => {
    // 100×50 display rect at (10,20) with scale 0.5 → 200×100 native at (20,40)
    const r = toNative(10, 20, 100, 50, SCALE, IMG.w, IMG.h);
    expect(r.x).toBe(20);
    expect(r.y).toBe(40);
    expect(r.width).toBe(200);
    expect(r.height).toBe(100);
  });
});

describe('toNative — clamping', () => {
  it('clamps negative x/y to 0', () => {
    const r = toNative(-10, -20, 50, 50, SCALE, IMG.w, IMG.h);
    expect(r.x).toBe(0);
    expect(r.y).toBe(0);
  });

  it('clamps x beyond image width to imgW', () => {
    // origin way off right side
    const r = toNative(5000, 0, 10, 10, SCALE, IMG.w, IMG.h);
    expect(r.x).toBe(IMG.w);
    expect(r.width).toBe(0); // no space left
  });

  it('clamps y beyond image height to imgH', () => {
    const r = toNative(0, 5000, 10, 10, SCALE, IMG.w, IMG.h);
    expect(r.y).toBe(IMG.h);
    expect(r.height).toBe(0);
  });

  it('clamps width so box does not exceed right edge', () => {
    // origin at native 1800px, box is 500px wide — must be clamped to 120px
    const displayX = 1800 * SCALE;
    const displayW = 500 * SCALE;
    const r = toNative(displayX, 0, displayW, 10, SCALE, IMG.w, IMG.h);
    expect(r.x).toBe(1800);
    expect(r.width).toBe(120); // 1920 - 1800 = 120
  });

  it('clamps height so box does not exceed bottom edge', () => {
    const displayY = 1000 * SCALE;
    const displayH = 500 * SCALE;
    const r = toNative(0, displayY, 10, displayH, SCALE, IMG.w, IMG.h);
    expect(r.y).toBe(1000);
    expect(r.height).toBe(80); // 1080 - 1000 = 80
  });

  it('produces non-negative width and height when origin is clamped to edge', () => {
    const r = toNative(5000, 5000, 100, 100, SCALE, IMG.w, IMG.h);
    expect(r.width).toBeGreaterThanOrEqual(0);
    expect(r.height).toBeGreaterThanOrEqual(0);
  });
});
