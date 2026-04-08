// Missing required parameters
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MisTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // No midPos
  const r1 = await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [40, 0, 0],
  })
  console.log('[15] no midPos:', r1.result, 'maxLevel:', r1.maxLevel, 'msgs:', JSON.stringify(r1.messages))

  // No startPos
  const r2 = await api.v1.sketch.arcBy3Points({
    id: skId,
    midPos: [20, 20, 0],
    endPos: [40, 0, 0],
  })
  console.log('[15] no startPos:', r2.result, 'maxLevel:', r2.maxLevel, 'msgs:', JSON.stringify(r2.messages))

  // No endPos
  const r3 = await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [0, 0, 0],
    midPos: [20, 20, 0],
  })
  console.log('[15] no endPos:', r3.result, 'maxLevel:', r3.maxLevel, 'msgs:', JSON.stringify(r3.messages))

  // No id
  const r4 = await api.v1.sketch.arcBy3Points({
    startPos: [0, 0, 0],
    midPos: [20, 20, 0],
    endPos: [40, 0, 0],
  })
  console.log('[15] no id:', r4.result, 'maxLevel:', r4.maxLevel, 'msgs:', JSON.stringify(r4.messages))

  filewrite({
    noMidPos: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    noStartPos: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    noEndPos: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    noId: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'missing-params')

  return { partId }
}
