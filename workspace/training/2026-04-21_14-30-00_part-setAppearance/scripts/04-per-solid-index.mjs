export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IndexTest' })).result

  // Create a box, then a boolean union to make a multi-solid feature
  const box1 = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Box2', length: 40, width: 30, height: 20, translation: [80, 0, 0] })).result

  console.log('[04] box1:', box1, 'box2:', box2)

  // Color whole box1 red
  const r1 = await api.v1.part.setAppearance({ target: box1, color: [255, 0, 0] })
  console.log('[04] whole feature color:', r1.maxLevel)

  // Color whole box2 blue
  const r2 = await api.v1.part.setAppearance({ target: box2, color: [0, 0, 255] })
  console.log('[04] whole feature2 color:', r2.maxLevel)

  await snapshot('two-boxes-colored')

  // Now try per-solid indexing on box1 (single-solid feature — index 0)
  const r3 = await api.v1.part.setAppearance({ target: { id: box1, indices: [0] }, color: [0, 255, 0] })
  console.log('[04] index [0] on single-solid:', r3.maxLevel)
  if (r3.messages?.length) console.log('[04] index [0] msgs:', JSON.stringify(r3.messages))

  // Try out-of-range index [1] on single-solid feature
  const r4 = await api.v1.part.setAppearance({ target: { id: box1, indices: [1] }, color: [255, 255, 0] })
  console.log('[04] index [1] on single-solid:', r4.maxLevel)
  if (r4.messages?.length) console.log('[04] index [1] msgs:', JSON.stringify(r4.messages))

  // Empty indices
  const r5 = await api.v1.part.setAppearance({ target: { id: box1, indices: [] }, color: [128, 0, 128] })
  console.log('[04] empty indices:', r5.maxLevel)

  filewrite({
    wholeFeature: { maxLevel: r1.maxLevel, msgs: r1.messages },
    indexZero: { maxLevel: r3.maxLevel, msgs: r3.messages },
    indexOneOOR: { maxLevel: r4.maxLevel, msgs: r4.messages },
    emptyIndices: { maxLevel: r5.maxLevel, msgs: r5.messages },
  }, 'index-results')

  await snapshot('after-indexing')
  return { partId }
}
