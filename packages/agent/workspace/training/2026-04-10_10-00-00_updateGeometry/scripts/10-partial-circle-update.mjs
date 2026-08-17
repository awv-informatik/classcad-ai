// Test: Can you update only centerPos of a circle, omitting radius? Or only radius?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const geo = await api.v1.sketch.geometry({
    id: skId,
    circles: [{ centerPos: [25, 25, 0], radius: 15 }],
    genFixation: false,
  })
  const circId = geo.result.circles[0]
  console.log('[10] created circle:', circId)

  // Get original position
  const posBefore = await api.v1.sketch.getPositions({ id: circId })
  console.log('[10] pos before:', JSON.stringify(posBefore.result))

  // Update only centerPos, no radius
  const r1 = await api.v1.sketch.updateGeometry({
    id: skId,
    circles: [{ id: circId, centerPos: [50, 50, 0] }],
  })
  console.log('[10] center-only result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[10] center-only messages:', JSON.stringify(r1.messages))

  const posAfterCenter = await api.v1.sketch.getPositions({ id: circId })
  console.log('[10] pos after center-only:', JSON.stringify(posAfterCenter.result))

  // Update only radius, no centerPos
  const r2 = await api.v1.sketch.updateGeometry({
    id: skId,
    circles: [{ id: circId, radius: 30 }],
  })
  console.log('[10] radius-only result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[10] radius-only messages:', JSON.stringify(r2.messages))

  const posAfterRadius = await api.v1.sketch.getPositions({ id: circId })
  console.log('[10] pos after radius-only:', JSON.stringify(posAfterRadius.result))

  filewrite({
    before: posBefore.result,
    afterCenterOnly: posAfterCenter.result,
    afterRadiusOnly: posAfterRadius.result,
    r1: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    r2: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'partial-circle')

  await snapshot('final')

  return { partId }
}
