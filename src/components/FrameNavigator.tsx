import type { Annotation } from '../types';

type Props = {
  currentFrame: number;
  totalFrames: number;
  annotations: (Annotation | undefined)[];
  onPrev: () => void;
  onNext: () => void;
};

export function FrameNavigator({ currentFrame, totalFrames, annotations, onPrev, onNext }: Props) {
  const annotatedCount = annotations.filter((a): a is Annotation => a !== undefined).length;

  return (
    <div className="flex items-center justify-between bg-gray-800/50 rounded-xl px-4 py-3">
      <button
        onClick={onPrev}
        disabled={currentFrame === 0}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
      >
        ← Prev
      </button>

      <div className="text-center">
        <div className="text-sm font-mono text-gray-200">
          {currentFrame + 1} / {totalFrames}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {annotatedCount} annotated
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={currentFrame >= totalFrames - 1}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
      >
        Next →
      </button>
    </div>
  );
}
