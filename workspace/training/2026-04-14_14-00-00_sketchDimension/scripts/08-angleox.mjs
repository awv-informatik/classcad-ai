// Test: ANGLEOX dimension — angle of a line relative to X axis
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'DimTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Diagonal line at ~30°
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 28.87, 0] })).result
  const pts = (await api.v1.sketch.getPoints({ id: l1 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.startId] })

  const endBefore = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  console.log('[08] end before:', JSON.stringify(endBefore))

  await snapshot('before')

  // ANGLEOX with value=45deg — should rotate line to 45° from X axis
  const dimR = await api.v1.sketch.dimension({
    id: skId, type: 'ANGLEOX', geomIds: [l1], value: '45deg'
  })
  console.log('[08] ANGLEOX: result:', dimR.result, 'maxLevel:', dimR.maxLevel)

  const endAfter = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  console.log('[08] end after:', JSON.stringify(endAfter))

  const dimNode = dimR.structure ? Object.values(dimR.structure.tree).find(n => n.id === dimR.result) : null
  console.log('[08] dim class:', dimNode?.class)

  filewrite({
    dimId: dimR.result,
    maxLevel: dimR.maxLevel,
    dimClass: dimNode?.class,
    dimName: dimNode?.name,
    endBefore,
    endAfter,
    dimMembers: dimNode?.members
  }, 'angleox-data')

  await snapshot('after')

  return { partId }
}
