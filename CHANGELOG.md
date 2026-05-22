# Changelog

## [1.1.0] — 2026-05-22

### Added
- Per-frame annotation dot strip in the frame navigator (≤80 frames); falls back to a progress bar for larger extractions
- Keyboard shortcut hint ("use ← → keys") shown below the navigator controls
- 3-step workflow indicator (Upload → Extract → Annotate & export) in the upload screen
- Active-step indicator in the FPS selector screen (step 1 marked done, step 2 highlighted)
- Drag-active visual state on the drop zone (border brightens, background tints purple)
- Draw-hint label with icon when no annotation exists on the current frame
- Copy-forward label with icon indicating which frame the annotation was copied from

### Fixed
- File picker accepted any file type when "All Files" was selected in the OS dialog; now validates MIME type on selection, matching the existing drag-and-drop guard
- Bounding box coordinates could be negative or exceed image bounds when a rect was dragged outside the canvas; coordinates are now clamped to `[0, imageWidth/Height]`
- Export failures were silent — spinner would stop with no feedback; errors are now shown below the Export button

### Changed
- "New Video" button de-emphasized (ghost style) so Export is visually dominant
- SVG icon replaces text emoji in the upload drop zone for cross-platform consistency

---

## [1.0.0] — 2026-05-22

### Added
- Browser-only video frame extractor using ffmpeg.wasm (@ffmpeg/ffmpeg@0.11.6)
- Bounding-box annotation canvas via react-konva with draw, drag, and resize
- Copy-forward: navigating to the next frame auto-copies the most recent annotation
- Frame navigator with prev/next controls and per-frame annotation indicator
- Export to `lol-annotations.zip` — STORE-mode PNG frames + `annotations.json` with zip-relative paths and native-pixel bounding boxes
- OOM warning for high FPS × long video combinations at 720p / 1080p
- COI service worker for SharedArrayBuffer support on static hosts (GitHub Pages)

### Fixed
- Filename with hyphens word-wrapped in the FPS selector row (ISSUE-001)
- "New Video" button left the annotation canvas visible after reset (ISSUE-002)
