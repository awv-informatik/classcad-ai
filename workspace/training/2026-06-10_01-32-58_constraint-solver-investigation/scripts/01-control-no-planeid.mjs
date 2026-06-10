// Q1 (control): on a sketch WITHOUT planeId, are constraints + dimension values inert?
// This reproduces the conditions that likely produced SKETCHING.md's false "metadata only" claim.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Ctl' })).result
  const skId = (await api.v1.sketch.create({ id: partId, name: 'NoPlane' })).result // NO planeId

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [55, 5, 0], endPos: [55, 40, 0] })).result
  const p1 = (await api.v1.sketch.getPoints({ id: l1 })).result
  const p2 = (await api.v1.sketch.getPoints({ id: l2 })).result

  const cR = await api.v1.sketch.constraint({ id: skId, type: 'COINCIDENT', geomIds: [p1.endId, p2.startId] })
  const l2after = (await api.v1.sketch.getPositions({ id: l2 })).result
  console.log('[01] COINCIDENT maxLevel:', cR.maxLevel, '— l2.start after:', JSON.stringify(l2after.startPos), '(was 55,5; snap target 50,0)')

  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [100, 50, 0], radius: 20 })).result
  const dR = await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [c1], value: 45 })
  const node = Object.values(dR.structure?.tree ?? {}).find(n => n?.id === c1)
  console.log('[01] DIAMETER value:45 on r=20 circle — maxLevel:', dR.maxLevel, 'circle members:', JSON.stringify(node?.members ?? null))

  const uR = await api.v1.sketch.updateDimension({ id: dR.result, value: 45 })
  console.log('[01] updateDimension result:', uR.result, '(0 = unsolved per create.md) maxLevel:', uR.maxLevel)

  const nodeAfter = Object.values(uR.structure?.tree ?? {}).find(n => n?.id === c1)
  console.log('[01] radius after updateDimension:', nodeAfter?.members?.radius ?? JSON.stringify(nodeAfter?.members))
  filewrite({ constraint: cR.maxLevel, l2after, circleNode: node?.members, updResult: uR.result, after: nodeAfter?.members }, 'control')
  return { skId }
}
