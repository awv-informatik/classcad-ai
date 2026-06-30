// 21b — close the solver-liveness question: after a split, find the SURVIVING dimension by id
// (CC_LinearFeatureDimension node) and updateDimension it; verify the geometry actually re-solves/moves.
import { makeSketch, line, positions, firstError } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const l = await line(api, skId, [0, 0, 0], [100, 0, 0])
  const pts = (await api.v1.sketch.getPoints({ id: l })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.startId] })
  await api.v1.sketch.dimension({ id: skId, name: 'LEN', type: 'HORIZONTAL_DISTANCE', geomIds: [pts.startId, pts.endId], value: 100 })

  const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: l, values: [0.5] }] })
  const tree = r.structure?.tree || {}
  // surviving dimension feature (id type 'dimension')
  const dimNode = Object.values(tree).find(n => n.class === 'CC_LinearFeatureDimension')
  // the two new line segments (CC_Line), to measure overall length before/after
  const segLines = Object.values(tree).filter(n => n.class === 'CC_Line').map(n => n.id)
  console.log('[21b] dimNode id', dimNode?.id, 'name', dimNode?.name, 'segLines', JSON.stringify(segLines))

  // far endpoint of the chain BEFORE updating (expect x=100)
  const farBefore = await positions(api, segLines[segLines.length - 1])
  // updateDimension on the surviving dimension id -> value 60
  const upd = await api.v1.sketch.updateDimension({ id: dimNode.id, value: 60 })
  const farAfter = await positions(api, segLines[segLines.length - 1])
  console.log('[21b] updateDimension result', upd.result, 'max', upd.maxLevel, 'err', JSON.stringify(firstError(upd)))
  console.log('[21b] far endpoint before', JSON.stringify(farBefore.endPos), 'after', JSON.stringify(farAfter.endPos))

  filewrite({ dimId: dimNode?.id, updResult: upd.result, updMax: upd.maxLevel, farBefore: farBefore.endPos, farAfter: farAfter.endPos }, '21b-solver-live')
  const solved = upd.result === 1
  const moved = farBefore.endPos && farAfter.endPos && Math.abs(farAfter.endPos[0] - farBefore.endPos[0]) > 1
  console.log('[21b]', solved && moved ? 'SOLVER LIVE: dimension re-solved, geometry moved (100->~60)' : 'see data')
  return { solved, moved, farAfter: farAfter.endPos }
}
