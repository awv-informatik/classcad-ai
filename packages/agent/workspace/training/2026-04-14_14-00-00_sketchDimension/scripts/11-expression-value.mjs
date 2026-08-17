// Test: dimension with expression value and @expr reference
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'DimTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Create an expression
  await api.v1.part.expression({ id: partId, name: 'myWidth', value: 40 })

  // Line of 80 units
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const pts = (await api.v1.sketch.getPoints({ id: l1 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.startId] })

  // OFFSET with @expr.myWidth — should resize line to 40
  const dimR = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1], value: '@expr.myWidth' })
  console.log('[11] dim result:', dimR.result, 'maxLevel:', dimR.maxLevel)

  const endAfter = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  console.log('[11] line end after @expr.myWidth=40:', JSON.stringify(endAfter))

  // Also test formula expression: '60+10'
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 20, 0], endPos: [100, 20, 0] })).result
  const pts2 = (await api.v1.sketch.getPoints({ id: l2 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts2.startId] })

  const dim2R = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l2], value: '60+10' })
  console.log('[11] formula dim: result:', dim2R.result, 'maxLevel:', dim2R.maxLevel)

  const end2After = (await api.v1.sketch.getPositions({ id: pts2.endId })).result
  console.log('[11] line2 end after "60+10":', JSON.stringify(end2After))

  filewrite({
    exprDim: { id: dimR.result, maxLevel: dimR.maxLevel, endAfter },
    formulaDim: { id: dim2R.result, maxLevel: dim2R.maxLevel, end2After }
  }, 'expression-data')

  await snapshot('result')

  return { partId }
}
