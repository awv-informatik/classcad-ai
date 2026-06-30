// 22 — undo claim probe. Is there a general undo (common.undo / sketch.undo)? Probe the SERVER via batch
// (the typed wrapper has neither). Then test postTrim / splitCurvesMergeBack as the real "reverse" after a split.
import { makeSketch, line, firstError } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)

  // Probe server-side existence of undo endpoints via batch (wrapper lacks them).
  const probe = await api.v1.common.batch({ jobs: [{ api: 'v1.common.undo' }, { api: 'v1.sketch.undo' }] })
  const undoProbe = probe.result
  console.log('[22] undo probe via batch:', JSON.stringify(undoProbe))

  // Bare split, then try postTrim and splitCurvesMergeBack as a reverse.
  const l = await line(api, skId, [0, 0, 0], [100, 0, 0])
  const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: l, values: [0.5] }] })
  const linesAfterSplit = (await api.v1.sketch.getGeometry({ id: skId })).result.lines
  console.log('[22] after split lines', JSON.stringify(linesAfterSplit))

  const rPost = await api.v1.sketch.postTrim({ id: skId })
  const linesAfterPost = (await api.v1.sketch.getGeometry({ id: skId })).result.lines
  console.log('[22] postTrim max', rPost.maxLevel, 'lines after postTrim', JSON.stringify(linesAfterPost), 'err', JSON.stringify(firstError(rPost)))

  const rMerge = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  const linesAfterMerge = (await api.v1.sketch.getGeometry({ id: skId })).result.lines
  console.log('[22] splitCurvesMergeBack max', rMerge.maxLevel, 'lines after merge', JSON.stringify(linesAfterMerge), 'err', JSON.stringify(firstError(rMerge)))

  filewrite({ undoProbe, linesAfterSplit, postTrimMax: rPost.maxLevel, linesAfterPost, mergeMax: rMerge.maxLevel, linesAfterMerge }, '22-undo')
  return {
    undoEndpointsExist: undoProbe?.map(j => j?.maxLevel),
    splitRestoredByMerge: linesAfterMerge?.length === 1,
    splitRestoredByPostTrim: linesAfterPost?.length === 1,
  }
}
