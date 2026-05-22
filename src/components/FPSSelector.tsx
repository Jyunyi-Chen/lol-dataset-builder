import { useState } from 'react';
import type { VideoMeta } from '../hooks/useVideoMeta';

type Props = {
  fps: number;
  videoFile: File;
  meta: VideoMeta | null;
  isExtracting: boolean;
  onFpsChange: (fps: number) => void;
  onExtract: () => void;
};

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

export function FPSSelector({ fps, videoFile, meta, isExtracting, onFpsChange, onExtract }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const warning = getWarning(fps, meta);
  const estimatedFrames = meta ? Math.ceil(fps * meta.duration) : null;
  const needsConfirm = warning !== null && !confirmed;

  function handleFpsChange(val: number) {
    setConfirmed(false);
    onFpsChange(val);
  }

  function handleExtract() {
    if (needsConfirm) return;
    onExtract();
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400 font-medium truncate max-w-[8rem] shrink-0" title={videoFile.name}>
          {videoFile.name.length > 30 ? videoFile.name.slice(0, 28) + '…' : videoFile.name}
        </span>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm text-gray-400">FPS</label>
          <input
            type="number"
            min={0.1}
            max={30}
            step={0.1}
            value={fps}
            onChange={(e) => handleFpsChange(parseFloat(e.target.value) || 1)}
            className="w-20 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:border-purple-500"
          />
          {estimatedFrames !== null && (
            <span className="text-xs text-gray-500">~{estimatedFrames} frames</span>
          )}
        </div>
      </div>

      {warning && (
        <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3 text-sm text-amber-300">
          <p>{warning.message}</p>
          {!confirmed && (
            <button
              onClick={() => setConfirmed(true)}
              className="mt-2 text-xs underline text-amber-400 hover:text-amber-300"
            >
              Continue anyway
            </button>
          )}
        </div>
      )}

      <button
        onClick={handleExtract}
        disabled={isExtracting || needsConfirm}
        className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {/* T22: indeterminate spinner, not a progress bar */}
        {isExtracting ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Extracting frames…
          </>
        ) : (
          'Extract Frames'
        )}
      </button>
    </div>
  );
}
