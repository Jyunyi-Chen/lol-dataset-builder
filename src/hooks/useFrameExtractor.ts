import { useRef, useState } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

type FFmpegInstance = ReturnType<typeof createFFmpeg>;

type UseFrameExtractorResult = {
  frames: Uint8Array[];
  isExtracting: boolean;
  extractError: string | null;
  extract: (videoFile: File, fps: number) => Promise<void>;
  clearFrames: () => void;
  clearError: () => void;
};

export function useFrameExtractor(): UseFrameExtractorResult {
  const [frames, setFrames] = useState<Uint8Array[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Ref guard: createFFmpeg and ffmpeg.load() run only once
  const ffmpegRef = useRef<FFmpegInstance | null>(null);
  const isLoadedRef = useRef(false);

  async function extract(videoFile: File, fps: number) {
    setIsExtracting(true);
    setExtractError(null);
    try {
      if (!ffmpegRef.current) {
        ffmpegRef.current = createFFmpeg({
          log: false,
          corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
        });
      }
      // T14: wrap load() in same try/catch — network errors surface as error banner
      if (!isLoadedRef.current) {
        try {
          await ffmpegRef.current.load();
          isLoadedRef.current = true;
        } catch {
          throw new Error('Failed to load video processor — check your browser supports WebAssembly.');
        }
      }

      const ffmpeg = ffmpegRef.current;
      ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile));
      await ffmpeg.run('-i', 'input.mp4', '-vf', `fps=${fps}`, 'frame%04d.png');

      const allFiles = ffmpeg.FS('readdir', '/') as string[];
      const frameFiles = allFiles.filter((f: string) => /^frame\d+\.png$/.test(f)).sort();

      // T4: guard against 0 frames (invalid codec / format)
      if (frameFiles.length === 0) {
        throw new Error('No frames extracted — is this a valid video file?');
      }

      // T16: copy from Wasm heap view before heap can reallocate
      const extracted = frameFiles.map((f: string) => new Uint8Array(ffmpeg.FS('readFile', f) as Uint8Array));

      // T21: clean up MEMFS to free Wasm heap memory
      frameFiles.forEach((f: string) => ffmpeg.FS('unlink', f));
      ffmpeg.FS('unlink', 'input.mp4');

      setFrames(extracted);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Unknown error during extraction.');
      isLoadedRef.current = false; // allow retry on load failure
    } finally {
      setIsExtracting(false);
    }
  }

  function clearFrames() {
    setFrames([]);
  }

  function clearError() {
    setExtractError(null);
  }

  return { frames, isExtracting, extractError, extract, clearFrames, clearError };
}
