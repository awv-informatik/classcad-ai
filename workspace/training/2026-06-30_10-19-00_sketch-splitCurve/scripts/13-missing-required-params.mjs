// 13 — missing id / splits / geomId / values: required-param enforcement + error codes.
import { makeSketch, line, firstError } from './_setup.mjs'

async function call(api, label, param, filewrite) {
  let r, threw = null
  try { r = await api.v1.sketch.splitCurve(param) } catch (e) { threw = String(e) }
  const isArr = Array.isArray(r?.result)
  const row = { label, maxLevel: r?.maxLevel, isArray: isArr, nEntries: isArr ? r.result.length : null, err: r ? firstError(r) : null, threw }
  filewrite({ param, ...row, result: r?.result }, `13-${label}`)
  console.log('[13]', JSON.stringify(row))
  return row
}

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const l = await line(api, skId, [0, 0, 0], [100, 0, 0])
  const out = []
  out.push(await call(api, 'noId', { splits: [{ geomId: l, values: [0.5] }] }, filewrite))
  out.push(await call(api, 'noSplits', { id: skId }, filewrite))
  out.push(await call(api, 'noValues', { id: skId, splits: [{ geomId: l }] }, filewrite))
  out.push(await call(api, 'noGeomId', { id: skId, splits: [{ values: [0.5] }] }, filewrite))
  return { out }
}
