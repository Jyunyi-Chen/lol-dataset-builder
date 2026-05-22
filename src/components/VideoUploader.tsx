import { useRef } from 'react';

type Props = {
  onFile: (file: File) => void;
};

export function VideoUploader({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) onFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      className="border-2 border-dashed border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-colors"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
    >
      <div className="text-4xl mb-3">🎮</div>
      <p className="text-lg font-medium text-gray-200">Drop a LoL gameplay video here</p>
      <p className="text-sm text-gray-500 mt-1">or click to browse — MP4, WebM, MKV</p>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
