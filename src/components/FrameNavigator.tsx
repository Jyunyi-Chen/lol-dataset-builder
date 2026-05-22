import type { Annotation } from '../types';

type Props = {
  currentFrame: number;
  totalFrames: number;
  annotations: (Annotation | undefined)[];
  onPrev: () => void;
  onNext: () => void;
};

const MAX_DOTS = 80;

export function FrameNavigator({ currentFrame, totalFrames, annotations, onPrev, onNext }: Props) {
  const annotatedCount = annotations.filter((a): a is Annotation => a !== undefined).length;

  // Dot strip: show up to MAX_DOTS frames; bucket if more
  const showDots = totalFrames <= MAX_DOTS;

  return (
    <div className="bg-gray-800/50 rounded-xl px-4 py-3 space-y-3">
      {/* Progress dot strip */}
      {showDots && (
        <div className="flex gap-0.5 items-center" title={`${annotatedCount} of ${totalFrames} frames annotated`}>
          {Array.from({ length: totalFrames }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i === currentFrame
                  ? 'bg-purple-400'
                  : annotations[i] !== undefined
                  ? 'bg-purple-700'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      )}
      {!showDots && (
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 rounded-full transition-all"
            style={{ width: `${((currentFrame + 1) / totalFrames) * 100}%` }}
          />
        </div>
      )}

      {/* Nav controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={currentFrame === 0}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          title="Previous frame (←)"
        >
          ← Prev
        </button>

        <div className="text-center">
          <div className="text-sm font-mono text-gray-200">
            {currentFrame + 1} / {totalFrames}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {annotatedCount} annotated · use ← → keys
          </div>
        </div>

        <button
          onClick={onNext}
          disabled={currentFrame >= totalFrames - 1}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          title="Next frame (→) — copies last annotation forward"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
