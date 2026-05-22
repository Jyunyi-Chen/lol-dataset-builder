# Changelog

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
