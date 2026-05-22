import { useRef, useState } from 'react';

type Props = {
  onFile: (file: File) => void;
};

export function VideoUploader({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) onFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div className="space-y-6">
      {/* 3-step workflow indicator */}
      <div className="flex items-center justify-center gap-0">
        {[
          { n: '1', label: 'Upload video' },
          { n: '2', label: 'Extract frames' },
          { n: '3', label: 'Annotate & export' },
        ].map((step, i) => (
          <div key={step.n} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {step.n}
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{step.label}</span>
            </div>
            {i < 2 && <div className="w-8 h-px bg-gray-700 mx-2 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-purple-400 bg-purple-500/10'
            : 'border-gray-600 hover:border-purple-500 hover:bg-purple-500/5'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => inputRef.current?.click()}
      >
        <svg
          className="mx-auto mb-4 text-gray-500"
          width="40" height="40" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14" />
          <rect x="2" y="6" width="13" height="12" rx="2" />
        </svg>
        <p className="text-base font-medium text-gray-200">Drop a LoL gameplay video here</p>
        <p className="text-sm text-gray-400 mt-1.5">or click to browse — MP4, WebM, MKV</p>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {/* What happens next */}
      <p className="text-center text-xs text-gray-600">
        ffmpeg runs locally in your browser — your video never leaves your machine
      </p>
    </div>
  );
}
