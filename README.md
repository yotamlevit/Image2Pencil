# Image2Pencil — Pencil Sketch Studio

Turn any photo into a realistic pencil drawing, entirely in the browser. Built as a
learning tool for art students: load a reference, dial in the pencil character, then use
classic study aids — squint/value grouping, mirror flip, and a teaching grid — to draw
from it.

**100% client-side.** Images are decoded, processed (OpenCV.js + WebAssembly), and
exported on your device. Nothing is uploaded, so there are no server costs and full privacy.

## Features

- **Side-by-side workspace** — reference photo and generated sketch, with fluid
  pinch/zoom/pan (powered by `react-zoom-pan-pinch`). Pan/zoom the panels together
  (**Sync views**) or independently to inspect details.
- **Stroke** — drives the Gaussian blur radius, from a fine mechanical-pencil line to soft
  charcoal shading.
- **Contrast** — linear contrast pivoted on mid-gray to clean up the whites and richen the
  darks.
- **Squint mode** — posterizes the sketch into 2–6 flat value steps so students can read
  shadow masses (the classic "squint at it" technique).
- **Mirror / flip** — horizontally flips both views to expose proportion errors.
- **Teaching grid** — toggle a 2×2 / 3×3 / 4×4 / 8×8 drawing grid over both canvases.
- **Export** — download the sketch as a high-resolution PNG, with or without the grid.
- **Dark / light theme**, no-flash, persisted to `localStorage`.

## The pencil pipeline

The sketch is a real OpenCV pipeline (not a CSS filter), implemented in
[`public/workers/sketch.worker.js`](public/workers/sketch.worker.js):

1. **Grayscale** — `cv.cvtColor(src, …, COLOR_RGBA2GRAY)`
2. **Invert** — `cv.bitwise_not`
3. **Gaussian blur** — `cv.GaussianBlur` with a kernel size driven by the Stroke slider
4. **Color Dodge** via native matrix division (no per-pixel JS loop):
   `cv.divide(gray, 255 − blurredInverted, dst, 256.0)`
5. **Contrast** (`Mat.convertTo`, clamped) and an optional **posterize** (`cv.LUT`)

## Architecture notes

- **OpenCV.js is never bundled.** A stable build (`4.13.0`) is served as a static asset
  from [`public/opencv/opencv.js`](public/opencv/opencv.js) and loaded inside a Web Worker
  with `importScripts('/opencv/opencv.js')`. This keeps the ~11 MB WASM module out of the
  Next.js/webpack/Turbopack bundle.
- **All image work runs in a dedicated worker**, so the React UI stays at 60fps during
  high-res generation. The worker caches the source image and re-runs only the pipeline on
  each slider change; results return as transferable `ImageBitmap`s. Edits are debounced and
  stale frames are dropped.
- The build is single-threaded OpenCV — **no `SharedArrayBuffer`, so no COOP/COEP headers**
  are required (deploys to Vercel with zero extra config).
- Working resolution is capped (2800 px on the long edge) to keep live editing snappy and
  memory bounded.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · OpenCV.js 4.13 (WASM) ·
react-zoom-pan-pinch · lucide-react.

## Deploy

Push to a Git provider and import the repo into [Vercel](https://vercel.com/new) — no
configuration needed. `public/opencv/opencv.js` is committed and ships as a static asset.
