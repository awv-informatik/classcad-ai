// Test dimPos parameter — does it work for non-ANGLE types?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

  // OFFSET with dimPos
  const r1 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]], dimPos: [40, -30, 0] })
  console.log('[13] OFFSET with dimPos result:', r1.result, 'maxLevel:', r1.maxLevel)

  // HORIZONTAL_DISTANCE with dimPos
  const r2 = await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [rectIds[0]], dimPos: [40, -50, 0] })
  console.log('[13] HORIZONTAL_DISTANCE with dimPos result:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    offsetDimPos: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    hDistDimPos: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'dimpos-responses')

  await snapshot('dimpos')
  return { partId, skId }
}
