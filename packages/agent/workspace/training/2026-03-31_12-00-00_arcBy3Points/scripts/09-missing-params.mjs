// 09 - Missing required parameters
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MissingParams' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  // Missing midPos
  const r1 = await api.v1.curve.arcBy3Points({
    id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0],
  })
  console.log('[09] no midPos maxLevel:', r1.maxLevel)
  console.log('[09] no midPos msgs:', JSON.stringify(r1.messages))

  // Missing startPos
  const r2 = await api.v1.curve.arcBy3Points({
    id: shapeId, midPos: [25, 25, 0], endPos: [50, 0, 0],
  })
  console.log('[09] no startPos maxLevel:', r2.maxLevel)
  console.log('[09] no startPos msgs:', JSON.stringify(r2.messages))

  // Missing endPos
  const r3 = await api.v1.curve.arcBy3Points({
    id: shapeId, startPos: [0, 0, 0], midPos: [25, 25, 0],
  })
  console.log('[09] no endPos maxLevel:', r3.maxLevel)
  console.log('[09] no endPos msgs:', JSON.stringify(r3.messages))

  // Missing id
  const r4 = await api.v1.curve.arcBy3Points({
    startPos: [0, 0, 0], midPos: [25, 25, 0], endPos: [50, 0, 0],
  })
  console.log('[09] no id maxLevel:', r4.maxLevel)
  console.log('[09] no id msgs:', JSON.stringify(r4.messages))

  filewrite({
    noMidPos: { maxLevel: r1.maxLevel, messages: r1.messages },
    noStartPos: { maxLevel: r2.maxLevel, messages: r2.messages },
    noEndPos: { maxLevel: r3.maxLevel, messages: r3.messages },
    noId: { maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'missing-params-responses')

  return { partId }
}
