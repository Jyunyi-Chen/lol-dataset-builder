# LoL Dataset Builder

A browser-only tool for building bounding-box annotation datasets from League of Legends gameplay videos. Drop in a video, extract frames at a chosen frame rate, draw bounding boxes around health bars (or any object), and export a labeled ZIP archive — all without uploading anything to a server.

## Who it's for

Anyone who wants to train an object-detection model on LoL gameplay and needs labeled still frames. The typical use case is annotating the enemy health bar region across many frames so a downstream model can learn to locate it. No cloud account, no installation, no Python environment required — just a modern browser.

## Workflow

The app has three sequential steps shown in a progress indicator at the top:

1. **Upload video** — Drop a gameplay recording onto the drop zone or click to browse. MP4, WebM, and MKV are accepted.
2. **Extract frames** — Choose a frame rate (default 1 FPS), review the estimated frame count, and click "Extract Frames". ffmpeg runs entirely in your browser; the video never leaves your machine.
3. **Annotate & export** — Step through each frame, draw a bounding box around the target object, and export when done.

## Running locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. The app requires `SharedArrayBuffer`, which Vite enables automatically in dev mode via the `coi-serviceworker` package. No extra configuration needed.

To build for production:

```bash
npm run build
```

The output goes to `dist/`. The project is configured for GitHub Pages deployment (`base: '/lol-dataset-builder/'`) via the workflow in `.github/workflows/deploy.yml`.

## Uploading a video

Drag and drop a video file onto the drop zone, or click it to open a file picker. Only video files are accepted (the MIME type is checked on both drag-and-drop and file picker selection). After a file is selected you move to the frame extraction step automatically.

## Extracting frames

Use the FPS input to control how many frames per second are extracted. Lower values mean fewer frames and faster extraction; higher values capture more motion at the cost of memory and time.

The app shows an estimated frame count before you start. If the count is high for the video resolution (more than ~200 frames at 1080p, or ~500 at 720p), a warning appears and asks you to confirm before proceeding — very large extractions can exhaust browser memory and crash the tab.

Extraction is done by ffmpeg.wasm running in a Web Worker. A spinner shows while it runs. All frames are stored as PNG `Uint8Array` buffers in memory; they are not written to disk.

## Drawing bounding boxes

Once frames are extracted, the canvas shows the current frame scaled to fill the available width.

- **Draw:** Click and drag anywhere on the canvas to draw a new bounding box. A purple rectangle appears as you drag; release to confirm it. Any previously drawn box is replaced.
- **Resize:** After drawing, purple handles appear at the corners and edges. Drag a handle to resize the box.
- **Move:** Drag the box itself (not a handle) to reposition it.
- **Redraw:** Click and drag on an empty area to start a new box, discarding the current one.

All coordinates are stored in native image pixels (not display pixels), so the annotation is resolution-independent regardless of how the canvas is scaled.

## Frame navigation

Use the **← Prev** and **→ Next** buttons, or the left/right arrow keys on your keyboard, to move between frames.

A progress strip at the top of the navigator shows the annotation state of every frame:

- **Bright purple dot** — current frame
- **Dim purple dot** — annotated frame
- **Gray dot** — unannotated frame

If there are more than 80 frames, the dot strip is replaced with a simple progress bar showing how far through the sequence you are.

## Annotation copy-forward

When you press **Next** (or the right arrow key) and the destination frame has no annotation yet, the app automatically copies the most recent annotation from any earlier frame. A label appears on the canvas saying which frame it was copied from.

This saves time when the target object moves only slightly between frames — navigate forward, make a small adjustment to the copied box, and continue. If you draw a new box or drag the existing one, the copy label disappears and the frame is treated as manually annotated.

## Exporting

The **Export** button (green, at the bottom) is enabled once at least one frame is annotated. It shows how many frames will be included.

Clicking Export generates a ZIP file called `lol-annotations.zip` and downloads it automatically. The ZIP contains:

```
lol-annotations.zip
├── frames/
│   ├── frame0001.png
│   ├── frame0003.png
│   └── ...          (only annotated frames are included)
└── annotations.json
```

Frame filenames use 1-based, zero-padded 4-digit numbers matching the original extraction sequence. PNG files are stored uncompressed (STORE mode) because PNGs are already compressed internally.

### annotations.json format

```json
[
  {
    "frame": "frames/frame0001.png",
    "bbox": {
      "x": 142,
      "y": 38,
      "width": 312,
      "height": 24
    }
  },
  ...
]
```

- `frame` — ZIP-relative path to the image file
- `bbox.x`, `bbox.y` — top-left corner of the bounding box in native image pixels
- `bbox.width`, `bbox.height` — dimensions of the bounding box in native image pixels

All four values are integers (rounded). Coordinates are clamped to the image bounds, so no value will be negative or extend beyond the image edge.

## Known limitations

- **Memory-bound** — all frames are kept as PNG buffers in the browser's heap. A 10-minute 1080p60 video at 1 FPS produces ~600 frames; at higher FPS or longer durations the tab may run out of memory and crash. Use the FPS warning as a guide.
- **No persistence** — annotations and frames live only in memory. Refreshing or closing the tab loses all work. There is no save/load feature.
- **Single bounding box per frame** — each frame supports exactly one annotation. Multi-label or multi-class annotation is not implemented.
- **No label classes** — all annotations are unlabeled bounding boxes. There is no way to assign a class name or confidence score.
- **Video-only input** — the tool extracts frames from a video file. There is no way to annotate a folder of existing still images.
- **No undo** — drawing a new box replaces the previous one immediately. There is no undo/redo stack.

## Recommended improvements

- **Session persistence** — save annotations and frame blobs to `localStorage` or IndexedDB so work survives a page refresh.
- **Multi-class labels** — add a class selector alongside the canvas so each box can carry a label (e.g. "ally\_health", "enemy\_health", "minion\_health").
- **Multi-box per frame** — allow drawing more than one bounding box per frame.
- **Image folder input** — accept a folder of PNG/JPEG frames as an alternative to video extraction, for people who already have frames.
- **Keyboard shortcuts** — `D` to delete the current annotation, `C` to manually trigger copy-forward, number keys to jump to a specific frame.
- **Export format options** — YOLO `.txt` format or COCO JSON in addition to the current custom format.
- **Progress saving** — export a partial session file and re-import it to resume where you left off.

## Architecture notes

- **ffmpeg.wasm** — pinned to `@ffmpeg/ffmpeg@0.11.6` with `corePath` pointing to `unpkg.com/@ffmpeg/core@0.11.0`. The worker is loaded once and reused across extractions (guarded by `isLoadedRef`). MEMFS is cleaned up after each extraction to free memory.
- **SharedArrayBuffer** — required by ffmpeg.wasm. The `coi-serviceworker` package injects the necessary `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers at runtime, making it work on GitHub Pages without server configuration.
- **react-konva** — the annotation canvas is a Konva Stage with a single Layer containing the frame image, an optional annotation `Rect`, a rubber-band `Rect` drawn during mouse-down/move, and a `Transformer` wired to the annotation rect for resize handles. All coordinates are stored in native image pixels; a `scale` factor converts between display pixels and native pixels.
- **Scale-aware rendering** — the Stage fills the container width via a `ResizeObserver`. `scale = containerWidth / imageNativeWidth`. Coordinates in `annotations` state are always in native pixels; the canvas multiplies by `scale` before rendering and divides by `scale` before saving.
- **Export compression** — JSZip's `STORE` mode (no compression) is used for PNG frames because PNGs are already compressed. `DEFLATE` on already-compressed data wastes CPU with negligible size benefit.
