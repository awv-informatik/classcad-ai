// 16 — preTrim error codes + VOID guard + duplicate-curveIds (NOT de-duplicated).
import { makeSketch, line, firstError } from './_setup.mjs'

async function call(api, label, param, filewrite) {
  const r = await api.v1.sketch.preTrim(param)
  const isArr = Array.isArray(r.result)
  const row = { label, maxLevel: r.maxLevel, isArray: isArr, nEntries: isArr ? r.result.length : null, err: firstError(r) }
  filewrite(row, `16-${label}`)
  console.log('[16]', JSON.stringify(row))
  return row
}

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)
  const L1 = await line(api, skId, [0, 0, 0], [100, 100, 0])
  const L2 = await line(api, skId, [0, 100, 0], [100, 0, 0])
  const pointId = (await api.v1.sketch.getPoints({ id: L1 })).result?.startId

  const out = []
  out.push(await call(api, 'noId', {}, filewrite))
  out.push(await call(api, 'badId', { id: 999999 }, filewrite))
  out.push(await call(api, 'partId', { id: partId }, filewrite))
  out.push(await call(api, 'planeId', { id: planeId }, filewrite))
  out.push(await call(api, 'cidBad', { id: skId, curveIds: [999999] }, filewrite))
  out.push(await call(api, 'cidSketch', { id: skId, curveIds: [skId] }, filewrite))
  out.push(await call(api, 'cidPoint', { id: skId, curveIds: [pointId] }, filewrite))
  out.push(await call(api, 'cidMixed', { id: skId, curveIds: [L1, 999999] }, filewrite))
  // duplicate curveIds -> NOT de-duplicated? (this one may succeed; run last in case it stages)
  out.push(await call(api, 'cidDup', { id: skId, curveIds: [L1, L1, L2] }, filewrite))

  const fails = out.filter(o => o.maxLevel >= 51)
  console.log('[16] all failures result-not-array?', fails.every(o => !o.isArray))
  return { out }
}
