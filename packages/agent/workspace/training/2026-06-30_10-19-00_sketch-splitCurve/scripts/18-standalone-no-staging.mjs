// 18 — standalone: splitCurve commits immediately (no SplittedCurves/NoneSplitted staging, unlike preTrim);
// postTrim after a bare split is a no-op/error. Contrast: preTrim DOES create staging containers.
import { makeSketch, addSketch, line, firstError } from './_setup.mjs'

const stagingClasses = tree => Object.values(tree || {})
  .map(n => n.class).filter(c => /Splitted|NoneSplitted/i.test(c || ''))

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)
  const l = await line(api, skId, [0, 0, 0], [100, 0, 0])

  const rSplit = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: l, values: [0.5] }] })
  const afterSplit = await api.v1.sketch.getGeometry({ id: skId })
  const stagingAfterSplit = stagingClasses(afterSplit.structure?.tree)
  console.log('[18] split ok', Array.isArray(rSplit.result), 'getGeometry.lines', JSON.stringify(afterSplit.result.lines))
  console.log('[18] staging containers after splitCurve:', JSON.stringify(stagingAfterSplit), '(expect none)')

  // postTrim after a bare splitCurve
  const rPost = await api.v1.sketch.postTrim({ id: skId })
  console.log('[18] postTrim-after-split maxLevel', rPost.maxLevel, 'err', JSON.stringify(firstError(rPost)))

  // contrast: preTrim on a fresh sketch with two intersecting lines -> staging containers SHOULD appear
  const sk2 = await addSketch(api, partId, planeId, 'PreTrim')
  await line(api, sk2, [0, 0, 0], [100, 100, 0])
  await line(api, sk2, [0, 100, 0], [100, 0, 0])
  const rPre = await api.v1.sketch.preTrim({ id: sk2 })
  const afterPre = await api.v1.sketch.getGeometry({ id: sk2 })
  const stagingAfterPre = stagingClasses(rPre.structure?.tree || afterPre.structure?.tree)
  console.log('[18] preTrim ok', Array.isArray(rPre.result), 'staging containers after preTrim:', JSON.stringify(stagingAfterPre), '(expect some)')

  filewrite({ stagingAfterSplit, postTrimMax: rPost.maxLevel, postTrimErr: firstError(rPost), stagingAfterPre, preResult: rPre.result }, '18-staging')
  const checks = {
    splitImmediate: Array.isArray(rSplit.result) && afterSplit.result.lines.length === 2,
    noStagingAfterSplit: stagingAfterSplit.length === 0,
  }
  console.log('[18] CHECKS', JSON.stringify(checks))
  return { checks, stagingAfterSplit, stagingAfterPre }
}
