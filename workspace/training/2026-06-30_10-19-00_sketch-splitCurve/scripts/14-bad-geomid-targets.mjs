// 14 — bad/wrong-class geomId: bogus, part id, sketch id, point id, foreign-sketch curve.
// Does result.length stay == splits.length (doc claim), error the whole call, or drop the entry?
import { makeSketch, addSketch, line, firstError } from './_setup.mjs'

async function call(api, skId, label, geomId, filewrite) {
  const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId, values: [0.5] }] })
  const isArr = Array.isArray(r.result)
  const row = {
    label, geomId, maxLevel: r.maxLevel, isArray: isArr,
    nEntries: isArr ? r.result.length : null,
    entrySegs: isArr ? r.result.map(e => e.splittedCurves?.length) : null,
    err: firstError(r),
  }
  filewrite({ ...row, result: r.result }, `14-${label}`)
  console.log('[14]', JSON.stringify(row))
  return row
}

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)
  const l = await line(api, skId, [0, 0, 0], [100, 0, 0])
  const pts = (await api.v1.sketch.getPoints({ id: l })).result
  const pointId = pts?.startId
  // foreign curve: a 2nd sketch on the same part with its own line
  const sk2 = await addSketch(api, partId, planeId, 'Foreign')
  const foreign = await line(api, sk2, [0, 50, 0], [100, 50, 0])
  console.log('[14] partId', partId, 'skId', skId, 'line', l, 'pointId', pointId, 'foreignCurve', foreign)

  const out = []
  out.push(await call(api, skId, 'bogus', 999999, filewrite))
  out.push(await call(api, skId, 'partId', partId, filewrite))
  out.push(await call(api, skId, 'sketchId', skId, filewrite))
  out.push(await call(api, skId, 'pointId', pointId, filewrite))
  out.push(await call(api, skId, 'foreignCurve', foreign, filewrite))
  return { out }
}
