import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Annotation } from '../types';

type Props = {
  frame: Uint8Array;
  frameIndex: number;
  annotation: Annotation | undefined;
  copiedFromFrame: number | null;
  onAnnotate: (ann: Annotation) => void;
};

type TempRect = { x: number; y: number; w: number; h: number };

export function AnnotationCanvas({ frame, frameIndex, annotation, copiedFromFrame, onAnnotate }: Props) {
  // T15: Konva <Image> requires HTMLImageElement, not a blob URL string
  const [konvaImage, setKonvaImage] = useState<HTMLImageElement | undefined>();
  const [imgDims, setImgDims] = useState({ w: 800, h: 450 });
  const blobUrlRef = useRef<string | null>(null);

  // Container width tracking for Stage sizing (D3/T19)
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  // Drawing state (T12)
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [tempRect, setTempRect] = useState<TempRect | null>(null);

  // Konva refs for Transformer wiring (T13)
  const rectRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // T1 + T15: create HTMLImageElement from blob URL; revoke previous on frame change
  useEffect(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    const url = URL.createObjectURL(new Blob([frame.buffer as ArrayBuffer], { type: 'image/png' }));
    blobUrlRef.current = url;
    const img = new Image();
    img.onload = () => {
      setKonvaImage(img);
      setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = url;

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [frame]);

  // Container resize observer (T19)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // T13: wire Transformer to Rect when annotation is present
  useEffect(() => {
    if (annotation && transformerRef.current && rectRef.current) {
      transformerRef.current.nodes([rectRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [annotation]);

  // D3/T19: Stage at display size; scale converts display ↔ native pixel coords.
  // Always scale to fill the container width (upscale small videos for annotation precision).
  const scale = imgDims.w > 0 ? containerWidth / imgDims.w : 1;
  const stageWidth = Math.floor(imgDims.w * scale);
  const stageHeight = Math.floor(imgDims.h * scale);

  // Convert display-pixel coords to native pixel coords for saving; clamp to image bounds
  function toNative(x: number, y: number, w: number, h: number): Pick<Annotation, 'x' | 'y' | 'width' | 'height'> {
    const nx = Math.max(0, Math.min(x / scale, imgDims.w));
    const ny = Math.max(0, Math.min(y / scale, imgDims.h));
    return {
      x: nx,
      y: ny,
      width: Math.min(w / scale, imgDims.w - nx),
      height: Math.min(h / scale, imgDims.h - ny),
    };
  }

  // T12: rubber-band draw — allow on Stage or image; only skip when clicking the annotation rect
  function handleStageMouseDown(e: KonvaEventObject<MouseEvent>) {
    // If click lands on the existing annotation Rect, let Konva handle drag — don't start a new draw
    if (rectRef.current && e.target === rectRef.current) return;
    const pos = e.target.getStage()!.getPointerPosition()!;
    setIsDrawing(true);
    setDrawStart(pos);
    setTempRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  }

  function handleStageMouseMove(e: KonvaEventObject<MouseEvent>) {
    if (!isDrawing || !drawStart) return;
    const pos = e.target.getStage()!.getPointerPosition()!;
    setTempRect({
      x: Math.min(pos.x, drawStart.x),
      y: Math.min(pos.y, drawStart.y),
      w: Math.abs(pos.x - drawStart.x),
      h: Math.abs(pos.y - drawStart.y),
    });
  }

  function handleStageMouseUp() {
    if (!isDrawing || !tempRect) return;
    setIsDrawing(false);
    setDrawStart(null);
    if (tempRect.w > 5 && tempRect.h > 5) {
      const native = toNative(tempRect.x, tempRect.y, tempRect.w, tempRect.h);
      onAnnotate({ frameIndex, ...native });
    }
    setTempRect(null);
  }

  // T11 + T20: update on dragEnd only (D2 decision); reset scaleX/scaleY after transform
  function handleDragEnd(e: KonvaEventObject<MouseEvent>) {
    const node = e.target as Konva.Rect;
    const native = toNative(node.x(), node.y(), node.width() * node.scaleX(), node.height() * node.scaleY());
    onAnnotate({ frameIndex, ...native });
  }

  function handleTransformEnd() {
    const node = rectRef.current!;
    const newW = node.width() * node.scaleX();
    const newH = node.height() * node.scaleY();
    // T20: reset accumulated scale to prevent drift on repeated resizes
    node.scaleX(1);
    node.scaleY(1);
    node.width(newW);
    node.height(newH);
    const native = toNative(node.x(), node.y(), newW, newH);
    onAnnotate({ frameIndex, ...native });
  }

  const hasAnnotation = annotation !== undefined;
  // T6: empty state hint
  const showHint = !hasAnnotation && !isDrawing;

  return (
    <div className="space-y-1">
      <div ref={containerRef} className="w-full rounded-xl overflow-hidden bg-black">
        <Stage
          width={stageWidth}
          height={stageHeight}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          style={{ cursor: isDrawing ? 'crosshair' : hasAnnotation ? 'default' : 'crosshair', display: 'block' }}
        >
          <Layer>
            {konvaImage && (
              <KonvaImage
                image={konvaImage}
                width={stageWidth}
                height={stageHeight}
              />
            )}

            {/* Existing annotation rect */}
            {hasAnnotation && (
              <Rect
                ref={rectRef}
                x={annotation!.x * scale}
                y={annotation!.y * scale}
                width={annotation!.width * scale}
                height={annotation!.height * scale}
                stroke="#a855f7"
                strokeWidth={2}
                fill="rgba(168, 85, 247, 0.1)"
                draggable
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
              />
            )}

            {/* Rubber-band rect being drawn */}
            {tempRect && tempRect.w > 2 && tempRect.h > 2 && (
              <Rect
                x={tempRect.x}
                y={tempRect.y}
                width={tempRect.w}
                height={tempRect.h}
                stroke="#a855f7"
                strokeWidth={2}
                fill="rgba(168, 85, 247, 0.1)"
                listening={false}
              />
            )}

            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              borderStroke="#a855f7"
              anchorStroke="#a855f7"
              anchorFill="#fff"
              anchorSize={8}
            />
          </Layer>
        </Stage>
      </div>

      {/* T6: empty state hint — prominent enough to actually be seen */}
      {showHint && (
        <div className="flex items-center justify-center gap-2 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400 shrink-0">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18M3 9h18" />
          </svg>
          <p className="text-sm text-purple-300 font-medium">
            Click and drag to draw a bounding box
          </p>
        </div>
      )}

      {/* T2: copy-forward label */}
      {copiedFromFrame !== null && (
        <div className="flex items-center justify-center gap-2 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400 shrink-0">
            <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2" />
            <rect x="8" y="8" width="12" height="12" rx="2" />
          </svg>
          <p className="text-sm text-purple-300">
            Copied from frame {copiedFromFrame + 1} — drag or redraw to override
          </p>
        </div>
      )}
    </div>
  );
}
