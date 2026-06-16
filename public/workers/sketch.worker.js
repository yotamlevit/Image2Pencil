/*
 * Image2Pencil — OpenCV.js pencil-sketch worker.
 *
 * Shipped as a STATIC asset and started with `new Worker('/workers/sketch.worker.js')`,
 * so OpenCV's ~11 MB WASM module never passes through the Next.js / webpack bundle.
 * OpenCV is loaded with importScripts() and the whole image pipeline runs here, off the
 * main thread, keeping the React UI at 60fps during high-res generation.
 *
 * Message protocol (see src/lib/types.ts for the typed mirror):
 *   in  : { type:'load', buffer, width, height }      -> cache source at working res
 *         { type:'process', id, params }              -> run pipeline, return a bitmap
 *         { type:'clear' }                            -> free the cached source
 *   out : { type:'ready' }
 *         { type:'loaded', width, height }
 *         { type:'result', id, width, height, bitmap }
 *         { type:'error', id?, stage?, message }
 */

// Cap the working resolution: keeps live slider edits snappy and bounds WASM-heap memory.
// Exports still render at this resolution (up to 2800px on the long edge = plenty for print).
var MAX_DIM = 2800;

var cvReady = false;
var srcMat = null; // cached RGBA source (CV_8UC4) at working resolution
var workW = 0;
var workH = 0;

// --- OpenCV bootstrap -------------------------------------------------------
// The UMD build ends with `return cv(Module)`, honoring a pre-existing global
// `Module`. Defining Module (with onRuntimeInitialized) BEFORE importScripts is
// race-free: the callback fires once the WASM runtime is live and `self.cv` is
// the populated OpenCV namespace.
self.Module = {
  onRuntimeInitialized: function () {
    cvReady = true;
    self.postMessage({ type: 'ready' });
  },
};

try {
  importScripts('/opencv/opencv.js');
} catch (err) {
  self.postMessage({
    type: 'error',
    stage: 'load-opencv',
    message: 'Failed to load OpenCV.js: ' + describe(err),
  });
}

// --- message dispatch -------------------------------------------------------
self.onmessage = function (event) {
  var msg = event.data;
  if (!msg || typeof msg.type !== 'string') return;
  try {
    if (msg.type === 'load') return handleLoad(msg);
    if (msg.type === 'process') return handleProcess(msg);
    if (msg.type === 'clear') return handleClear();
  } catch (err) {
    self.postMessage({
      type: 'error',
      id: msg.id,
      stage: msg.type,
      message: describe(err),
    });
  }
};

function handleClear() {
  if (srcMat) {
    srcMat.delete();
    srcMat = null;
  }
  workW = 0;
  workH = 0;
}

function handleLoad(msg) {
  if (!cvReady) {
    self.postMessage({ type: 'error', stage: 'load', message: 'OpenCV is not ready yet.' });
    return;
  }
  handleClear();

  var imageData = new ImageData(new Uint8ClampedArray(msg.buffer), msg.width, msg.height);
  var full = cv.matFromImageData(imageData);

  var scale = Math.min(1, MAX_DIM / Math.max(msg.width, msg.height));
  if (scale < 1) {
    workW = Math.max(1, Math.round(msg.width * scale));
    workH = Math.max(1, Math.round(msg.height * scale));
    var resized = new cv.Mat();
    cv.resize(full, resized, new cv.Size(workW, workH), 0, 0, cv.INTER_AREA);
    full.delete();
    srcMat = resized;
  } else {
    workW = msg.width;
    workH = msg.height;
    srcMat = full;
  }

  self.postMessage({ type: 'loaded', width: workW, height: workH });
}

// --- the 5-step pencil pipeline --------------------------------------------
function handleProcess(msg) {
  if (!cvReady || !srcMat) return;
  var p = msg.params || {};

  // 1. Grayscale
  var gray = new cv.Mat();
  cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY);

  // 2. Invert
  var inverted = new cv.Mat();
  cv.bitwise_not(gray, inverted);

  // 3. Gaussian blur (kernel driven by the stroke slider)
  var k = kernelFor(p.stroke);
  var blurred = new cv.Mat();
  cv.GaussianBlur(inverted, blurred, new cv.Size(k, k), 0, 0, cv.BORDER_DEFAULT);

  // 4. Color Dodge via native matrix division: gray / (255 - blurred) * 256
  //    `255 - blurred` is exactly bitwise_not for 8-bit data.
  var invBlur = new cv.Mat();
  cv.bitwise_not(blurred, invBlur);
  var sketch = new cv.Mat();
  cv.divide(gray, invBlur, sketch, 256.0);

  // 5a. Contrast — linear, pivoted on mid-gray. convertTo clamps (no abs artifact),
  //     pushing whites cleaner and darks richer.
  var a = clamp(typeof p.contrast === 'number' ? p.contrast : 1, 0.5, 3);
  if (a !== 1) {
    sketch.convertTo(sketch, -1, a, Math.round(128 * (1 - a)));
  }

  // 5b. Squint / posterize — collapse tones into discrete value steps via a LUT
  //     (256-entry table, no per-pixel JS loop over the image).
  var levels = p.posterize | 0;
  if (levels >= 2) applyPosterize(sketch, levels);

  // Grayscale -> RGBA for the canvas.
  var rgba = new cv.Mat();
  cv.cvtColor(sketch, rgba, cv.COLOR_GRAY2RGBA);
  var out = new ImageData(new Uint8ClampedArray(rgba.data), rgba.cols, rgba.rows);

  gray.delete();
  inverted.delete();
  blurred.delete();
  invBlur.delete();
  sketch.delete();
  rgba.delete();

  // ImageBitmap is transferable -> zero-copy hand-off and cheap to draw.
  createImageBitmap(out)
    .then(function (bitmap) {
      self.postMessage(
        { type: 'result', id: msg.id, width: workW, height: workH, bitmap: bitmap },
        [bitmap]
      );
    })
    .catch(function (err) {
      self.postMessage({ type: 'error', id: msg.id, stage: 'encode', message: describe(err) });
    });
}

// stroke 1..100 -> odd Gaussian kernel (3..151). Bigger = softer, charcoal-like.
function kernelFor(stroke) {
  var s = clamp(typeof stroke === 'number' ? stroke : 12, 1, 100);
  var k = Math.round(s * 1.2);
  if (k < 1) k = 1;
  if (k % 2 === 0) k += 1;
  return Math.min(k, 151);
}

function applyPosterize(mat, levels) {
  var lut = new cv.Mat(1, 256, cv.CV_8UC1);
  var step = 255 / (levels - 1);
  for (var i = 0; i < 256; i++) {
    lut.data[i] = Math.round(Math.round(i / step) * step);
  }
  cv.LUT(mat, lut, mat);
  lut.delete();
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function describe(err) {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  // OpenCV often throws a numeric exception pointer; surface a readable hint.
  if (typeof err === 'number' && typeof cv !== 'undefined' && cv.exceptionFromPtr) {
    try {
      return cv.exceptionFromPtr(err).msg || 'OpenCV error #' + err;
    } catch (_) {
      return 'OpenCV error #' + err;
    }
  }
  return String(err);
}
