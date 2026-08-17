/**
 * browser.mjs — Browser adapter: canvas-based PNG encoding for the portable
 * core. No dependencies; works in any modern browser (uses OffscreenCanvas
 * when available, falls back to a DOM canvas).
 *
 * Typical use (e.g. a deterministic snapshot for buerli-ai):
 *   const entries = await renderSessionData({ tree, graphic, execute }, { view: 'iso' })
 *   const png = await entryToPngBase64(entries[0])   // base64 PNG, no data: prefix
 */

export * from './core.mjs'
export * from './stl.mjs'

function makeCanvas(width, height) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height)
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  return c
}

async function canvasToPngBase64(canvas) {
  if (canvas.convertToBlob) {
    const blob = await canvas.convertToBlob({ type: 'image/png' })
    const buf = await blob.arrayBuffer()
    let bin = ''
    const bytes = new Uint8Array(buf)
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
    return btoa(bin)
  }
  return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '')
}

/** Encode an RGBA pixel buffer (Uint8Array/Buffer) as base64 PNG. */
export async function pixelsToPngBase64(pixels, width, height) {
  const canvas = makeCanvas(width, height)
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(width, height)
  img.data.set(pixels instanceof Uint8ClampedArray ? pixels : new Uint8ClampedArray(pixels.buffer ?? pixels))
  ctx.putImageData(img, 0, 0)
  return canvasToPngBase64(canvas)
}

/** Rasterize an SVG string to base64 PNG at its declared width/height. */
export async function svgToPngBase64(svg, width, height) {
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  try {
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = () => reject(new Error('SVG rasterization failed'))
      img.src = url
    })
    const w = width ?? img.naturalWidth
    const h = height ?? img.naturalHeight
    const canvas = makeCanvas(w, h)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)
    return canvasToPngBase64(canvas)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Encode one renderSessionData entry (pixels or svg) as base64 PNG. */
export async function entryToPngBase64(entry) {
  if (entry.kind === 'pixels') return pixelsToPngBase64(entry.pixels, entry.width, entry.height)
  return svgToPngBase64(entry.svg)
}
