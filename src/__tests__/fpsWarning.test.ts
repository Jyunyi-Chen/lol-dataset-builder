import { describe, it, expect } from 'vitest';
import type { VideoMeta } from '../hooks/useVideoMeta';

// Mirrors getWarning in FPSSelector.tsx
function getWarning(fps: number, meta: VideoMeta | null): { message: string; count: number } | null {
  if (!meta || !meta.duration) return null;
  const count = Math.ceil(fps * meta.duration);
  const is1080p = meta.height >= 900;
  const is720p = meta.height >= 650;
  if ((is1080p && count > 200) || (is720p && !is1080p && count > 500)) {
    return { message: `This will extract ~${count} frames at ${meta.width}×${meta.height}. High frame counts may be slow or crash the browser.`, count };
  }
  return null;
}

const meta720p: VideoMeta = { width: 1280, height: 720, duration: 60, fps: 30 };
const meta1080p: VideoMeta = { width: 1920, height: 1080, duration: 60, fps: 30 };
const meta480p: VideoMeta = { width: 854, height: 480, duration: 60, fps: 30 };

describe('getWarning', () => {
  it('returns null when no meta', () => {
    expect(getWarning(1, null)).toBeNull();
  });

  it('returns null when duration is 0', () => {
    expect(getWarning(1, { ...meta1080p, duration: 0 })).toBeNull();
  });

  it('returns null for 480p regardless of frame count', () => {
    expect(getWarning(30, meta480p)).toBeNull(); // 1800 frames, but below 650px height
  });

  it('returns null for 720p under the 500-frame threshold', () => {
    expect(getWarning(1, { ...meta720p, duration: 60 })).toBeNull(); // 60 frames
  });

  it('warns for 720p over 500 frames', () => {
    // 9 fps × 60s = 540 frames
    const w = getWarning(9, { ...meta720p, duration: 60 });
    expect(w).not.toBeNull();
    expect(w!.count).toBe(540);
    expect(w!.message).toContain('540 frames');
  });

  it('returns null for 1080p under the 200-frame threshold', () => {
    expect(getWarning(1, { ...meta1080p, duration: 60 })).toBeNull(); // 60 frames
  });

  it('warns for 1080p over 200 frames', () => {
    // 4 fps × 60s = 240 frames
    const w = getWarning(4, { ...meta1080p, duration: 60 });
    expect(w).not.toBeNull();
    expect(w!.count).toBe(240);
  });

  it('uses the 1080p threshold for height >= 900 (not 720p threshold)', () => {
    const meta = { ...meta1080p, height: 900 };
    // 720p threshold would fire at >500 frames. 1080p fires at >200.
    // 4fps × 60s = 240 — should warn (1080p branch), NOT pass (720p branch would need >500)
    expect(getWarning(4, meta)).not.toBeNull();
  });
});
