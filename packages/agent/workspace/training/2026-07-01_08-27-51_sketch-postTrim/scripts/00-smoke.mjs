// 00-smoke — postTrim finalizes: VOID/mL31, staging containers cleaned, constraints recreated, sketch editable.
import { makeSketch, line, positions, containers, vecApprox } from './_setup.mjs'

async function segTouching(api, entry, point) {
  for (const s of entry.splittedCurves) { const p = await positions(api, s.id); if (vecApprox(p.startPos, point, 1e-6) || vecApprox(p.endPos, point, 1e-6)) return s.id }
  return null
}
const consNames = tree => Object.values(tree || {}).filter(n => /Constraint/.test(n.class || '')).map(n => n.name)

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const h = await line(api, skId, [0, 50, 0], [100, 50, 0])
  const v = await line(api, skId, [50, 0, 0], [50, 100, 0])

  const pre = await api.v1.sketch.preTrim({ id: skId })
  const contsStaged = containers(pre.structure?.tree).map(c => c.name)
  const oh1 = await segTouching(api, pre.result.find(e => e.sourceId === h), [0, 50, 0])
  const oh2 = await segTouching(api, pre.result.find(e => e.sourceId === v), [50, 0, 0])
  await api.v1.sketch.trim({ id: skId, curveIds: [oh1, oh2] })

  const rPost = await api.v1.sketch.postTrim({ id: skId })
  const contsAfter = containers(rPost.structure?.tree).map(c => c.name)
  const consAfter = consNames(rPost.structure?.tree)
  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  const survivors = []
  for (const id of geo.lines) { const p = await positions(api, id); survivors.push({ id, start: p.startPos, end: p.endPos }) }
  filewrite({ contsStaged, rPostResult: rPost.result, rPostMax: rPost.maxLevel, contsAfter, consAfter, geo, survivors }, 'smoke')
  console.log('[00] preTrim staging containers:', JSON.stringify(contsStaged))
  console.log('[00] postTrim result', JSON.stringify(rPost.result), 'maxLevel', rPost.maxLevel)
  console.log('[00] containers AFTER postTrim:', JSON.stringify(contsAfter), '(cleaned?)')
  console.log('[00] constraints AFTER postTrim:', JSON.stringify(consAfter))
  console.log('[00] survivors:', JSON.stringify(survivors))
  return {
    postVoid: rPost.result === null && rPost.maxLevel <= 31,
    stagingCleaned: contsAfter.length === 0,
    cleanL: geo.lines.length === 2,
  }
}
