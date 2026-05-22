import { useEffect, useState } from 'react';
import type { Annotation } from './types';
import { useFrameExtractor } from './hooks/useFrameExtractor';
import { useVideoMeta } from './hooks/useVideoMeta';
import { VideoUploader } from './components/VideoUploader';
import { FPSSelector } from './components/FPSSelector';
import { AnnotationCanvas } from './components/AnnotationCanvas';
import { FrameNavigator } from './components/FrameNavigator';
import { ExportButton } from './components/ExportButton';

function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [fps, setFps] = useState(1);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [annotations, setAnnotations] = useState<(Annotation | undefined)[]>([]);
  // T2/D1: copiedFromFrame in App state; passed as prop to AnnotationCanvas
  const [copiedFromFrame, setCopiedFromFrame] = useState<number | null>(null);

  const { frames, isExtracting, extractError, extract, clearFrames, clearError } = useFrameExtractor();
  const meta = useVideoMeta(videoFile);

  function handleFile(file: File) {
    setVideoFile(file);
    setCurrentFrame(0);
    setAnnotations([]);
    setCopiedFromFrame(null);
  }

  async function handleExtract() {
    if (!videoFile) return;
    setCurrentFrame(0);
    setAnnotations([]);
    setCopiedFromFrame(null);
    await extract(videoFile, fps);
  }

  // Copy-forward logic: on Next, check if annotation[N] is undefined and copy from most recent prior
  function onNext() {
    const N = currentFrame + 1;
    if (N >= frames.length) return;
    let copySource: number | null = null;
    if (annotations[N] === undefined) {
      const prior = annotations.slice(0, N).findLast((a): a is Annotation => a !== undefined);
      if (prior) {
        setAnnotations((prev) => {
          const next = [...prev];
          next[N] = { ...prior, frameIndex: N };
          return next;
        });
        copySource = prior.frameIndex;
      }
    }
    setCopiedFromFrame(copySource);
    setCurrentFrame(N);
  }

  function onPrev() {
    if (currentFrame === 0) return;
    setCopiedFromFrame(null);
    setCurrentFrame((f) => f - 1);
  }

  // Called by AnnotationCanvas on any user draw/drag/resize — clears copy-forward label
  function handleAnnotate(ann: Annotation) {
    setAnnotations((prev) => {
      const next = [...prev];
      next[ann.frameIndex] = ann;
      return next;
    });
    setCopiedFromFrame(null);
  }

  const hasFrames = frames.length > 0;

  // Keyboard navigation: ← → when in annotation view
  useEffect(() => {
    if (!hasFrames) return;
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [hasFrames, currentFrame, frames.length, annotations]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-bold text-white">LoL Dataset Builder</h1>
          <span className="text-xs text-gray-500">browser-only · no upload</span>
        </div>

        {/* Error banner */}
        {extractError && (
          <div className="bg-red-900/40 border border-red-700/50 rounded-xl p-3 flex items-start justify-between gap-3">
            <p className="text-sm text-red-300">{extractError}</p>
            <button onClick={clearError} className="text-red-400 hover:text-red-300 text-lg leading-none shrink-0">×</button>
          </div>
        )}

        {/* Step 1: Upload */}
        {!videoFile && <VideoUploader onFile={handleFile} />}

        {/* Step 2: FPS + Extract */}
        {videoFile && !hasFrames && (
          <FPSSelector
            fps={fps}
            videoFile={videoFile}
            meta={meta}
            isExtracting={isExtracting}
            onFpsChange={setFps}
            onExtract={handleExtract}
          />
        )}

        {/* Step 3: Annotate */}
        {hasFrames && (
          <>
            <AnnotationCanvas
              frame={frames[currentFrame]}
              frameIndex={currentFrame}
              annotation={annotations[currentFrame]}
              copiedFromFrame={copiedFromFrame}
              onAnnotate={handleAnnotate}
            />

            <FrameNavigator
              currentFrame={currentFrame}
              totalFrames={frames.length}
              annotations={annotations}
              onPrev={onPrev}
              onNext={onNext}
            />

            <div className="flex gap-3 items-center">
              <button
                onClick={() => {
                  setVideoFile(null);
                  setCurrentFrame(0);
                  setAnnotations([]);
                  setCopiedFromFrame(null);
                  clearFrames();
                }}
                className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-xl transition-colors"
              >
                ← New Video
              </button>
              <div className="flex-1">
                <ExportButton frames={frames} annotations={annotations} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
