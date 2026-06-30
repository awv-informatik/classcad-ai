// 05 — curveIds subset: 3 lines through (50,50,0), preTrim only [L1,L2]. L3 excluded:
// absent from result, NOT split, parked under NoneSplitted container.
import { makeSketch, line, positions, containers, nodeById, vecApprox } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const L1 = await line(api, skId, [0, 50, 0], [100, 50, 0])   // horizontal
  const L2 = await line(api, skId, [50, 0, 0], [50, 100, 0])   // vertical
  const L3 = await line(api, skId, [0, 0, 0], [100, 100, 0])   // diagonal (all cross at 50,50)
  console.log('[05] L1', L1, 'L2', L2, 'L3', L3)

  const r = await api.v1.sketch.preTrim({ id: skId, curveIds: [L1, L2] })
  const tree = r.structure?.tree
  const conts = containers(tree)
  const none = conts.find(c => c.name === 'NoneSplitted')
  const L3node = nodeById(tree, L3)
  const L3pos = await positions(api, L3)
  const e1 = r.result.find(e => e.sourceId === L1)
  const cut1 = await positions(api, e1.splittedCurves[0].id)
  filewrite({ result: r.result, containers: conts, L3parent: L3node?.parent, nonesplittedId: none?.id, L3pos }, '05-subset')
  console.log('[05] result.length', r.result.length, 'sourceIds', JSON.stringify(r.result.map(e => e.sourceId)))
  console.log('[05] L3 in result?', r.result.some(e => e.sourceId === L3), '| L3 pos', JSON.stringify(L3pos.startPos), '->', JSON.stringify(L3pos.endPos))
  console.log('[05] containers', JSON.stringify(conts), '| L3 parent', L3node?.parent, 'NoneSplitted id', none?.id)

  const checks = {
    resultLen2: r.result.length === 2,
    sourcesAreL1L2: r.result.map(e => e.sourceId).sort().join() === [L1, L2].sort().join(),
    L3absent: !r.result.some(e => e.sourceId === L3),
    L3notSplit: vecApprox(L3pos.startPos, [0, 0, 0]) && vecApprox(L3pos.endPos, [100, 100, 0]) && L3pos.maxLevel <= 31,
    L1splitAt5050: vecApprox(cut1.endPos, [50, 50, 0], 1e-6),
    L3underNoneSplitted: none && L3node?.parent === none.id,
  }
  console.log('[05] CHECKS', JSON.stringify(checks))
  console.log('[05]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
