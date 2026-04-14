// Test: VERTICAL_DISTANCE dimension
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'DimTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Vertical line
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [0, 70, 0] })).result
  const pts = (await api.v1.sketch.getPoints({ id: l1 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.startId] })

  const posBefore = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  console.log('[04] before end:', JSON.stringify(posBefore))

  // VERTICAL_DISTANCE on the line with value 50 (currently 70)
  const dimR = await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [l1], value: 50 })
  console.log('[04] V_DIST: result:', dimR.result, 'maxLevel:', dimR.maxLevel)

  const posAfter = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  console.log('[04] after end:', JSON.stringify(posAfter))

  const dimNode = dimR.structure ? Object.values(dimR.structure.tree).find(n => n.id === dimR.result) : null

  filewrite({
    dimId: dimR.result,
    maxLevel: dimR.maxLevel,
    dimClass: dimNode?.class,
    dimName: dimNode?.name,
    posBefore,
    posAfter,
    resized: JSON.stringify(posBefore) !== JSON.stringify(posAfter)
  }, 'vdist-data')

  await snapshot('result')

  return { partId }
}
