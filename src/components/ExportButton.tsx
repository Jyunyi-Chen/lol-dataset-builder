import { useState } from 'react';
import JSZip from 'jszip';
import type { Annotation } from '../types';

type Props = {
  frames: Uint8Array[];
  annotations: (Annotation | undefined)[];
};

// T17: frame index (0-based) → ffmpeg filename convention (1-based, %04d)
function frameFilename(idx: number): string {
  return 'frame' + String(idx + 1).padStart(4, '0') + '.png';
}

export function ExportButton({ frames, annotations }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  // T23: type predicate to narrow (Annotation | undefined)[] → Annotation[]
  const annotated = annotations.filter((a): a is Annotation => a !== undefined);
  const hasAnnotations = annotated.length > 0;

  async function handleExport() {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const framesFolder = zip.folder('frames')!;

      for (const ann of annotated) {
        const idx = ann.frameIndex;
        const filename = frameFilename(idx);
        // T5: STORE mode — PNGs are already compressed; DEFLATE wastes CPU
        framesFolder.file(filename, frames[idx], { compression: 'STORE' });
      }

      // T18: "frame" key uses zip-relative path so consumers can join without path manipulation
      const jsonData = annotated.map((ann) => ({
        frame: 'frames/' + frameFilename(ann.frameIndex),
        bbox: {
          x: Math.round(ann.x),
          y: Math.round(ann.y),
          width: Math.round(ann.width),
          height: Math.round(ann.height),
        },
      }));
      zip.file('annotations.json', JSON.stringify(jsonData, null, 2));

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lol-annotations.zip';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      // T7: disabled when 0 annotations
      disabled={!hasAnnotations || isExporting}
      className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
    >
      {isExporting ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Exporting…
        </>
      ) : (
        <>
          ↓ Export ({annotated.length} frame{annotated.length !== 1 ? 's' : ''})
        </>
      )}
    </button>
  );
}
