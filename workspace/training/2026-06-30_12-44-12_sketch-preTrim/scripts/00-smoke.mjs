// 00-smoke — preTrim basics + resolve the staging-container question.
// Two lines crossing at (50,50,0): L1 (0,0,0)->(100,100,0), L2 (0,100,0)->(100,0,0).
import { makeSketch, line, positions } from './_setup.mjs'

const ang = () => 0
const containerClasses = tree => Object.values(tree || {})
  .filter(n => /split|trim|none/i.test((n.class || '') + ' ' + (n.name || '')))
  .map(n => ({ id: n.id, name: n.name, class: n.class, children: n.children?.length }))

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api)
  const L1 = await line(api, skId, [0, 0, 0], [100, 100, 0])
  const L2 = await line(api, skId, [0, 100, 0], [100, 0, 0])
  const geoBefore = (await api.v1.sketch.getGeometry({ id: skId })).result
  console.log('[00] L1', L1, 'L2', L2, 'geoBefore', JSON.stringify(geoBefore))

  const r = await api.v1.sketch.preTrim({ id: skId })
  console.log('[00] preTrim maxLevel', r.maxLevel, 'resultIsArray', Array.isArray(r.result))
  console.log('[00] result', JSON.stringify(r.result))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'preTrim-response')

  // spatial: each entry's middle split point should be the intersection (50,50,0)
  if (Array.isArray(r.result)) {
    for (const e of r.result) {
      const segPos = []
      for (const s of e.splittedCurves) {
        const p = await positions(api, s.id)
        segPos.push({ id: s.id, interval: s.interval, start: p.startPos, end: p.endPos, maxLevel: p.maxLevel })
      }
      console.log('[00] source', e.sourceId, 'segs', JSON.stringify(segPos.map(s => ({ iv: s.interval, s: s.start, e: s.end }))))
      filewrite({ sourceId: e.sourceId, segPos }, `seg-${e.sourceId}`)
    }
  }

  // KEY: dump structure + list any staging containers (resolve the open question)
  const containers = containerClasses(r.structure?.tree)
  console.log('[00] staging containers (split/trim/none in class|name):', JSON.stringify(containers))
  filewrite(r.structure, 'structure-after-preTrim')

  // what does getGeometry report mid-workflow?
  const geoAfter = (await api.v1.sketch.getGeometry({ id: skId })).result
  console.log('[00] geoAfter', JSON.stringify(geoAfter))

  await snapshot('after-preTrim')
  return { ok: Array.isArray(r.result), nEntries: r.result?.length, containers }
}
