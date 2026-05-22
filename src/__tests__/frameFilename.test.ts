import { describe, it, expect } from 'vitest';

// Mirrors the frameFilename function in ExportButton.tsx
function frameFilename(idx: number): string {
  return 'frame' + String(idx + 1).padStart(4, '0') + '.png';
}

describe('frameFilename', () => {
  it('converts 0-based index to 1-based padded name', () => {
    expect(frameFilename(0)).toBe('frame0001.png');
    expect(frameFilename(1)).toBe('frame0002.png');
    expect(frameFilename(9)).toBe('frame0010.png');
  });

  it('pads to 4 digits', () => {
    expect(frameFilename(99)).toBe('frame0100.png');
    expect(frameFilename(999)).toBe('frame1000.png');
  });

  it('handles large frame indices without truncation', () => {
    expect(frameFilename(9999)).toBe('frame10000.png');
  });
});
