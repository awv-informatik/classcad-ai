// ─── Snapshot tool — captures the Three.js canvas as base64 PNG ───────────────
//
// Since the agent runs in-browser alongside the Three.js canvas, we capture
// the canvas element directly (canvas.toDataURL). The host app must register
// a capturer function via setSnapshotCapturer() at init time.
//
// The capturer is a simple async function that:
//   1. Optionally resizes/forces a render
//   2. Calls canvas.toDataURL('image/png')
//   3. Returns the base64 data + metadata
//
// A default implementation (createCanvasCapturer) is provided that finds the
// Three.js canvas in the DOM and captures it.

export type SnapshotParams = {
  label?: string
  width?: number
  height?: number
}

export type SnapshotResult = {
  /** base64-encoded PNG image data (without data: prefix) */
  image: string
  /** MIME type (always image/png) */
  mimeType: string
  /** Width of the captured image */
  width: number
  /** Height of the captured image */
  height: number
  /** Label for the snapshot */
  label: string
}

export type SnapshotCapturer = (params: SnapshotParams) => Promise<SnapshotResult>

/**
 * Longest-side cap (px) applied when neither width nor height is requested.
 * Hi-DPI drawing buffers are often 2–3k px on a side; sending that verbatim
 * bloats the base64 payload and the model's token budget for no visual gain.
 */
export const MAX_SNAPSHOT_SIZE = 1024

/**
 * Resolve the target capture size, ALWAYS preserving the source aspect ratio.
 * The capturer blits the canvas into this size with drawImage, which stretches
 * the scene if w:h ≠ srcW:srcH. So width/height only influence the SCALE, never
 * the proportions — even when the model passes both (e.g. a literal 1024×768),
 * we fit the source within that box rather than distorting it.
 */
export function resolveSnapshotSize(
  srcW: number,
  srcH: number,
  params: SnapshotParams,
): { w: number; h: number } {
  if (params.width && params.height) {
    // Both given: treat as a bounding box and fit the source within it.
    const scale = Math.min(params.width / srcW, params.height / srcH)
    return { w: Math.round(srcW * scale), h: Math.round(srcH * scale) }
  }
  if (params.width) {
    return { w: params.width, h: Math.round((params.width * srcH) / srcW) }
  }
  if (params.height) {
    return { w: Math.round((params.height * srcW) / srcH), h: params.height }
  }
  const scale = Math.min(1, MAX_SNAPSHOT_SIZE / Math.max(srcW, srcH))
  return { w: Math.round(srcW * scale), h: Math.round(srcH * scale) }
}

let capturer: SnapshotCapturer | null = null

/** Register the snapshot capturer. Call once during app init. */
export function setSnapshotCapturer(fn: SnapshotCapturer): void {
  capturer = fn
}

/** Get the current snapshot capturer (may be null). */
export function getSnapshotCapturer(): SnapshotCapturer | null {
  return capturer
}

/**
 * Creates a default canvas capturer that finds the Three.js canvas in the DOM.
 *
 * Usage:
 * ```ts
 * import { setSnapshotCapturer, createCanvasCapturer } from '@buerli.io/ai'
 * setSnapshotCapturer(createCanvasCapturer())
 * ```
 *
 * Options:
 * - `selector`: CSS selector to find the canvas. Default: 'canvas[data-engine]' (r3f canvases)
 * - `canvasRef`: Direct ref to the canvas element (takes priority over selector)
 * - `forceRender`: Callback to force a render frame before capture (e.g. invalidate())
 *
 * IMPORTANT: this DOM-only capturer cannot synchronise the render with the
 * read-back, so the WebGL context MUST be created with `preserveDrawingBuffer: true`
 * — otherwise toDataURL returns a black frame once the browser composites. If you
 * can render inside <Canvas>, prefer the factory's AgentCanvas capturer, which
 * holds the renderer and reads in the same tick without that flag.
 */
export function createCanvasCapturer(opts?: {
  selector?: string
  canvasRef?: { current: HTMLCanvasElement | null }
  forceRender?: () => void | Promise<void>
}): SnapshotCapturer {
  const selector = opts?.selector ?? 'canvas[data-engine]'

  return async (params) => {
    const label = params.label ?? 'snapshot'

    // Force a render frame if provided, then wait one frame for it to land in
    // the (preserved) drawing buffer.
    if (opts?.forceRender) {
      await opts.forceRender()
      await new Promise(r => requestAnimationFrame(() => r(undefined)))
    }

    const canvas = opts?.canvasRef?.current ?? document.querySelector<HTMLCanvasElement>(selector)
    if (!canvas) {
      throw new Error(`No canvas found with selector "${selector}". Ensure the 3D view is mounted.`)
    }

    const srcW = canvas.width
    const srcH = canvas.height
    const { w, h } = resolveSnapshotSize(srcW, srcH, params)

    let dataUrl: string
    if (w !== srcW || h !== srcH) {
      const offscreen = document.createElement('canvas')
      offscreen.width = w
      offscreen.height = h
      const ctx = offscreen.getContext('2d')
      if (!ctx) throw new Error('Failed to create 2D context for snapshot resize')
      ctx.drawImage(canvas, 0, 0, w, h)
      dataUrl = offscreen.toDataURL('image/png')
    } else {
      dataUrl = canvas.toDataURL('image/png')
    }

    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
    return { image: base64, mimeType: 'image/png', width: w, height: h, label }
  }
}
