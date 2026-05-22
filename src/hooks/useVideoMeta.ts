import { useState, useEffect } from 'react';

export type VideoMeta = {
  duration: number;
  width: number;
  height: number;
};

export function useVideoMeta(file: File | null): VideoMeta | null {
  const [meta, setMeta] = useState<VideoMeta | null>(null);

  useEffect(() => {
    if (!file) {
      setMeta(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      setMeta({ duration: video.duration, width: video.videoWidth, height: video.videoHeight });
      URL.revokeObjectURL(url);
    };
    video.onerror = () => URL.revokeObjectURL(url);
    video.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return meta;
}
