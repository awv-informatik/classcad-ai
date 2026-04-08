// Test updateGeometry on arcBy3Points arcs — which key is used?
// arcByCenter uses 'arcsByCenter' array. What about 3-point arcs?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const arcId = (await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [0, 0, 0],
    midPos: [20, 20, 0],
    endPos: [40, 0, 0],
  })).result
  console.log('[13] arcId:', arcId)

  const posBefore = (await api.v1.sketch.getPositions({ id: arcId })).result
  console.log('[13] before:', JSON.stringify(posBefore))

  await snapshot('before-update')

  // Try updating via arcsByCenter (since the arc is stored as CC_CircularArc)
  const r1 = await api.v1.sketch.updateGeometry({
    id: skId,
    arcsByCenter: [{
      id: arcId,
      startPos: [-20, 0, 0],
      centerPos: [0, 0, 0],
      endPos: [20, 0, 0],
    }]
  })
  console.log('[13] update via arcsByCenter:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[13] update msgs:', JSON.stringify(r1.messages))

  const posAfter = (await api.v1.sketch.getPositions({ id: arcId })).result
  console.log('[13] after:', JSON.stringify(posAfter))

  await snapshot('after-update')

  filewrite({
    before: posBefore,
    after: posAfter,
    updateResult: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
  }, 'update-result')

  return { partId }
}
