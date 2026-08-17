// 09 — auto-postTrim on StopEditing: no v1 StopEditing endpoint (confirmed by grep, see journal). Probe whether
// part.closeFeature on a staged sketch implicitly finalizes (auto-postTrim) or leaves staging untouched.
import { makeSketch, line, positions, containers, firstError, vecApprox } from './_setup.mjs'

async function segTouching(api, entry, point) {
  for (const s of entry.splittedCurves) { const p = await positions(api, s.id); if (vecApprox(p.startPos, point, 1e-6) || vecApprox(p.endPos, point, 1e-6)) return s.id }
  return null
}
const names = tree => containers(tree).map(c => c.name).sort()

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const h = await line(api, skId, [0, 50, 0], [100, 50, 0]); const v = await line(api, skId, [50, 0, 0], [50, 100, 0])
  const pre = await api.v1.sketch.preTrim({ id: skId })
  const oh = await segTouching(api, pre.result.find(e => e.sourceId === h), [0, 50, 0])
  await api.v1.sketch.trim({ id: skId, curveIds: [oh] })
  const stagedBefore = names((await api.v1.sketch.getGeometry({ id: skId })).structure?.tree)
  console.log('[09] staged containers before closeFeature:', JSON.stringify(stagedBefore))

  // probe part.closeFeature on the sketch
  let cf = null, threw = null
  try { cf = await api.v1.part.closeFeature({ id: skId }) } catch (e) { threw = String(e) }
  const stagedAfter = cf ? names(cf.structure?.tree) : names((await api.v1.sketch.getGeometry({ id: skId })).structure?.tree)
  console.log('[09] part.closeFeature max', cf?.maxLevel, 'err', JSON.stringify(cf ? firstError(cf) : threw))
  console.log('[09] staged containers AFTER closeFeature:', JSON.stringify(stagedAfter), '(gone => auto-finalized)')

  filewrite({ stagedBefore, closeFeatureMax: cf?.maxLevel, closeFeatureErr: cf ? firstError(cf) : threw, stagedAfter }, '09-closefeature')
  const finalized = stagedAfter.length === 0
  console.log('[09] VERDICT:', cf?.maxLevel >= 51 || threw ? 'closeFeature errored on sketch id — no reachable auto-postTrim surface'
    : finalized ? 'closeFeature auto-finalized (staging gone)' : 'closeFeature left staging untouched')
  return { closeFeatureMax: cf?.maxLevel, finalized }
}
