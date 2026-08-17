// Test: OFFSET between two parallel lines (docs show this: dimension({..., type: 'OFFSET', geomIds: [line1, line2]}))
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'DimTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Two parallel horizontal lines, 30 units apart
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 30, 0], endPos: [80, 30, 0] })).result

  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })

  await snapshot('before')

  // OFFSET between two lines with value=50 — should move l2 to 50 units from l1
  const dimR = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1, l2], value: 50 })
  console.log('[13] OFFSET 2-line: result:', dimR.result, 'maxLevel:', dimR.maxLevel)

  if (dimR.messages?.length) {
    console.log('[13] messages:', JSON.stringify(dimR.messages))
  }

  // Check l2 position
  const pts2 = (await api.v1.sketch.getPoints({ id: l2 })).result
  const l2Start = (await api.v1.sketch.getPositions({ id: pts2.startId })).result
  const l2End = (await api.v1.sketch.getPositions({ id: pts2.endId })).result
  console.log('[13] l2 after: start=', JSON.stringify(l2Start), 'end=', JSON.stringify(l2End))

  const dimNode = dimR.structure ? Object.values(dimR.structure.tree).find(n => n.id === dimR.result) : null

  filewrite({
    dimId: dimR.result,
    maxLevel: dimR.maxLevel,
    messages: dimR.messages,
    dimClass: dimNode?.class,
    l2After: { start: l2Start, end: l2End }
  }, 'offset-two-lines-data')

  await snapshot('after')

  return { partId }
}
