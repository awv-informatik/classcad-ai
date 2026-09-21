// Housing-like case with toggles, to find what made "hollow a closed body" fail in the PVS v2 build.
import { call, volume, boxAt, cylAt, fmt } from './_setup.mjs'
const W = 2, L = 115, B = 39, H = 31.4
const PLANES = [ // outward normal, point on the outer plane
  { n: [-1, 0, 1], p: [-W, 0, H + W - 2.2] },
  { n: [1, 1, 0], p: [L + W, B + W - 6, 0] },
  { n: [4.2, 0, 24], p: [L + W, 0, H + W - 4.2] },
  { n: [-7.5 * 21, -7.5 * 36, 36 * 21], p: [-W, 19, H + W] }, // nose facet through three points
]
const len = (v) => Math.hypot(...v)
async function sliceAll(api, partId, target, label, shift, planes = PLANES) {
  let body = target
  for (const [i, pl] of planes.entries()) {
    const k = shift / len(pl.n)
    const pos = pl.p.map((c, j) => c + k * pl.n[j])
    const wp = (await api.v1.part.workPlane({ id: partId, name: `${label}_${i}`, position: pos, normal: pl.n })).result
    const r = await call(api.v1.part.slice({ id: partId, name: `${label}_slice_${i}`, targets: [body], reference: wp, inverted: 1 }))
    if (!r.id) return { body, err: r }
    body = r.id
  }
  return { body }
}
export async function run(api, { snapshot, filewrite }, o, tag) {
  const partId = (await api.v1.part.create({ name: 'Case' })).result
  const out = { tag, opts: o }
  let body = await boxAt(api, partId, 'Outer', [L + 2 * W, B + 2 * W, H + 2 * W], [-W, -W, -W])
  if (o.sliceTarget) body = (await sliceAll(api, partId, body, 'Body', 0)).body
  if (o.dish) { // open pocket in the roof, like the control deck
    const d = await boxAt(api, partId, 'Dish', [25, 30, 20], [47.5, -10, H + W - 2.5])
    body = (await call(api.v1.part.boolean({ id: partId, name: 'DishCut', type: 'SUBTRACTION', target: body, tools: [d] }))).id
  }
  out.solidVolume = await volume(api, partId)
  let cav = await boxAt(api, partId, 'Cavity', [L, B, H], [0, 0, 0])
  if (o.sliceTool) cav = (await sliceAll(api, partId, cav, 'Cav', -W)).body
  if (o.toolMinus) { // cavity less the grown dish, so the roof under the dish keeps its wall
    const g = await boxAt(api, partId, 'DishGrown', [29, 32, 20], [45.5, -10, H + W - 4.5])
    cav = (await call(api.v1.part.boolean({ id: partId, name: 'CavLessDish', type: 'SUBTRACTION', target: cav, tools: [g] }))).id
  }
  const both = await volume(api, partId)
  out.cavityVolume = typeof both === 'number' ? both - out.solidVolume : both
  const hollow = await call(api.v1.part.boolean({ id: partId, name: 'Hollow', type: 'SUBTRACTION', target: body, tools: [cav] }))
  out.hollow = hollow
  out.afterHollow = await volume(api, partId)
  out.expectAfterHollow = out.solidVolume - out.cavityVolume
  out.hollowOk = typeof out.afterHollow === 'number' && Math.abs(out.afterHollow - out.expectAfterHollow) < 1
  await snapshot(tag + '-hollow', { section: { origin: [57, 19, 15], normal: [0, 1, 0] } })
  if (hollow.id) { // the later feature that failed in the build: a bore through the front wall
    const bore = await cylAt(api, partId, 'LensBore', 22.8, 9, [-8, 11.6, 11.6], [0, Math.PI / 2, 0])
    const cut = await call(api.v1.part.boolean({ id: partId, name: 'LensOpening', type: 'SUBTRACTION', target: hollow.id, tools: [bore] }))
    out.bore = cut
    out.afterBore = await volume(api, partId)
    await snapshot(tag + '-bored', { section: { origin: [57, 19, 15], normal: [0, 1, 0] } })
  }
  console.log(`[${tag}]`, JSON.stringify(out, (k, v) => fmt(v)))
  filewrite(out, 'result')
  return { partId }
}
