// gallery.mjs — regenerates docs/gallery.png, the README's capability overview.
//
//   node scripts/run.mjs packages/renderer/docs/gallery.mjs     (from the repo root,
//                                                                 ClassCAD on :9094)
//
// Builds one flanged bushing live — asymmetric on purpose (a flat on the flange
// at the front, a side port in the hub at +X) so the side views and the two
// projection methods differ — and renders every tile from its session data.

import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { diffImages, renderSessionData } from '../dist/core.js'
import { labelsToSvg } from '../dist/node.js'

const OUT = fileURLToPath(new URL('./gallery.png', import.meta.url))
const TW = 500, TH = 375, CAP = 34, COLS = 4, ROWS = 3

export async function build(api) {
  await api.v1.common.setDatabaseSettings({ isGraphicEnabled: true, isCCGraphicEnabled: true, isSketchGraphicEnabled: true, doCurveTessellation: true })
  const id = (await api.v1.part.create({ name: 'Bushing' })).result
  const cs = async (name, offset, rotation = [0, 0, 0]) => (await api.v1.part.workCSys({ id, name, offset, rotation })).result
  const cyl = async (name, diameter, height, at, rotation) =>
    (await api.v1.part.cylinder({ id, name, diameter, height, references: [await cs(name + '_cs', at, rotation)] })).result
  const box = async (name, [length, width, height], at) =>
    (await api.v1.part.box({ id, name, length, width, height, references: [await cs(name + '_cs', at)] })).result
  const bool = async (name, type, target, tools) => (await api.v1.part.boolean({ id, name, type, target, tools })).result

  let body = await cyl('Flange', 60, 8, [0, 0, 0])
  body = await bool('Flat', 'SUBTRACTION', body, [await box('FlatCut', [62, 7, 10], [-31, -31, -1])])
  body = await bool('Hub', 'UNION', body, [await cyl('HubCyl', 30, 26, [0, 0, 8])])
  body = await bool('Bore', 'SUBTRACTION', body, [await cyl('BoreCyl', 16, 40, [0, 0, -3])])
  body = await bool('Port', 'SUBTRACTION', body, [await cyl('PortCyl', 8, 20, [0, 0, 22], [0, Math.PI / 2, 0])])
  const sketch = (await api.v1.sketch.create({ id })).result
  await api.v1.sketch.circle({ id: sketch, centerPos: [-40, 20, 0], radius: 9 })
  await api.v1.sketch.line({ id: sketch, startPos: [-52, 12, 0], endPos: [-28, 28, 0] })
  await api.v1.sketch.line({ id: sketch, startPos: [-52, 28, 0], endPos: [-28, 12, 0] })
  const addBoltHoles = async () => {
    const r = 22 / Math.SQRT2
    const holes = []
    for (const [sx, sy] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) holes.push(await cyl(`Bolt${holes.length}`, 6, 12, [sx * r, sy * r, -2]))
    body = await bool('BoltHoles', 'SUBTRACTION', body, holes)
  }
  return { addBoltHoles }
}

async function source(api) {
  const execute = async task => {
    const [[key, [param]]] = Object.entries(task)
    const [, domain, method] = key.split('.')
    return api.v1[domain][method](param)
  }
  return { tree: await api.tree({ refresh: true }), graphic: await api.graphic(), execute }
}

async function render(src, options) {
  const entries = await renderSessionData(src, { width: TW, height: TH, supersample: 3, vectorText: true, layers: ['solid'], ...options })
  return entries[0]
}

async function tile(entry, caption) {
  let img = sharp(Buffer.from(entry.pixels), { raw: { width: entry.width, height: entry.height, channels: 4 } })
  if (entry.labels?.length) img = sharp(await img.composite([{ input: Buffer.from(labelsToSvg(entry.labels, entry.width, entry.height)) }]).png().toBuffer())
  // Multi-view tiles are rendered at 2× (a quadrant per view) and scaled down.
  if (entry.width !== TW) img = sharp(await img.resize(TW, TH).png().toBuffer())
  return { image: await img.png().toBuffer(), caption }
}

const esc = t => t.replace(/[<>&]/g, c => `&#${c.charCodeAt(0)};`)
const FONT = `xml:space="preserve" font-family="Menlo, 'SF Mono', Monaco, Consolas, 'DejaVu Sans Mono', monospace"`

export default async function (api) {
  const { addBoltHoles } = await build(api)
  const before = await render(await source(api), { view: 'iso' })
  await addBoltHoles()
  const src = await source(api)
  const after = await render(src, { view: 'iso', frame: before.frame })
  const diff = diffImages(before, after)

  const tiles = [
    await tile(await render(src, { view: 'iso' }), "view: 'iso' — Z-up, front-right-top"),
    await tile(await render(src, { drawing: 'first-angle', width: 2 * TW, height: 2 * TH }), "drawing: 'first-angle' — ISO E"),
    await tile(await render(src, { drawing: 'third-angle', width: 2 * TW, height: 2 * TH }), "drawing: 'third-angle' — ISO A"),
    await tile(await render(src, { view: 'iso', lines: true }), 'lines: hidden edges dashed'),
    await tile(await render(src, { view: 'iso', section: { origin: [0, 0, 0], normal: [0, -1, 0] } }), 'section: capped and hatched cut'),
    await tile({ ...diff, labels: [] }, 'diffImages: before/after, changes in red'),
    await tile(await render(src, { sheet: true, width: 2 * TW, height: 2 * TH }), 'sheet: four views, shared ortho scale'),
    await tile(await render(src, {
      view: 'iso',
      highlightAt: [[8, 0, 16]],
      markers: [{ position: [22 / Math.SQRT2, -22 / Math.SQRT2, 8], label: 'BOLT' }, { position: [15, 0, 22], label: 'PORT' }],
    }), 'highlightAt + markers'),
    await tile(await render(src, { view: 'iso', sketchOverlay: true, layers: ['solid', 'sketch'] }), 'sketchOverlay: sketches on their real plane'),
    await tile(await render(src, { view: 'iso', annotate: true }), 'annotate: extents, axes triad, scale bar'),
    await tile(await render(src, { view: 'iso', xray: true }), 'xray: hidden geometry shines through'),
  ]

  const W = COLS * TW, H = ROWS * (TH + CAP)
  const layers = []
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`
  tiles.forEach((t, i) => {
    const x = (i % COLS) * TW, y = Math.floor(i / COLS) * (TH + CAP)
    layers.push({ input: t.image, left: x, top: y })
    svg += `<rect x="${x}" y="${y + TH}" width="${TW}" height="${CAP}" fill="#f1f2f4"/>`
    svg += `<text x="${x + 12}" y="${y + TH + 22}" ${FONT} font-size="15" fill="#2a2f3a">${esc(t.caption)}</text>`
  })
  // Title tile: the package and the camera vocabulary.
  const tx = (tiles.length % COLS) * TW, ty = Math.floor(tiles.length / COLS) * (TH + CAP)
  svg += `<rect x="${tx}" y="${ty}" width="${TW}" height="${TH + CAP}" fill="#1f2430"/>`
  const lines = [
    ['@classcad/renderer', 26, '#ffffff', 90],
    ['deterministic session renders', 15, '#aab2c0', 132],
    ['for CAD agents — same data,', 15, '#aab2c0', 156],
    ['same pixels, every time', 15, '#aab2c0', 180],
    ['views   iso · front · back · top', 14, '#d7dce5', 236],
    ['        bottom · left · right', 14, '#d7dce5', 258],
    ['        { azimuth, elevation }', 14, '#d7dce5', 280],
    ['drawing first-angle · third-angle', 14, '#d7dce5', 316],
    ['styles  shaded · lines · xray', 14, '#d7dce5', 352],
  ]
  for (const [text, size, fill, dy] of lines) svg += `<text x="${tx + 40}" y="${ty + dy}" ${FONT} font-size="${size}" fill="${fill}">${esc(text)}</text>`
  // Grid lines between tiles.
  for (let c = 1; c < COLS; c++) svg += `<rect x="${c * TW - 1}" y="0" width="1" height="${H}" fill="#d5d8de"/>`
  for (let r = 1; r < ROWS; r++) svg += `<rect x="0" y="${r * (TH + CAP) - 1}" width="${W}" height="1" fill="#d5d8de"/>`
  svg += '</svg>'

  await sharp({ create: { width: W, height: H, channels: 4, background: '#ffffff' } })
    .composite([...layers, { input: Buffer.from(svg), left: 0, top: 0 }])
    .png({ compressionLevel: 9 })
    .toFile(OUT)
  console.log('gallery written:', OUT)
}
