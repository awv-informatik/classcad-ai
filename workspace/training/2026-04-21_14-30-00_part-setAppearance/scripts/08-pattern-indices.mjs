export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PatternTest' })).result
  const box1 = (await api.v1.part.box({ id: partId, name: 'Box1', length: 30, width: 20, height: 15 })).result

  // Create a work axis for the pattern direction
  const waId = (await api.v1.part.workAxis({ id: partId, name: 'PatAxis', origin: [0, 0, 0], direction: [1, 0, 0] })).result

  // Create linear pattern (3 instances)
  const lpId = (await api.v1.part.linearPattern({
    id: partId,
    name: 'LP1',
    targets: [box1],
    dir1: { references: [waId], distance: 50, count: 3 },
  })).result
  console.log('[08] lpId:', lpId)

  await snapshot('pattern-before')

  // Color the entire pattern feature
  const r1 = await api.v1.part.setAppearance({ target: lpId, color: [255, 0, 0] })
  console.log('[08] pattern whole:', r1.maxLevel)
  if (r1.messages?.length) console.log('[08] pattern msgs:', JSON.stringify(r1.messages))

  // Try indices to target individual pattern instances
  // Pattern with 3 instances should have indices 0, 1, 2
  const r2 = await api.v1.part.setAppearance({ target: { id: lpId, indices: [0] }, color: [0, 255, 0] })
  console.log('[08] pattern index [0]:', r2.maxLevel)
  if (r2.messages?.length) console.log('[08] pattern [0] msgs:', JSON.stringify(r2.messages))

  const r3 = await api.v1.part.setAppearance({ target: { id: lpId, indices: [1] }, color: [0, 0, 255] })
  console.log('[08] pattern index [1]:', r3.maxLevel)
  if (r3.messages?.length) console.log('[08] pattern [1] msgs:', JSON.stringify(r3.messages))

  const r4 = await api.v1.part.setAppearance({ target: { id: lpId, indices: [2] }, color: [255, 255, 0] })
  console.log('[08] pattern index [2]:', r4.maxLevel)
  if (r4.messages?.length) console.log('[08] pattern [2] msgs:', JSON.stringify(r4.messages))

  // Try out-of-range index [3]
  const r5 = await api.v1.part.setAppearance({ target: { id: lpId, indices: [3] }, color: [128, 128, 128] })
  console.log('[08] pattern index [3] (OOR):', r5.maxLevel)
  if (r5.messages?.length) console.log('[08] pattern [3] msgs:', JSON.stringify(r5.messages))

  // Try multiple indices at once
  const r6 = await api.v1.part.setAppearance({ target: { id: lpId, indices: [0, 2] }, color: [128, 0, 128] })
  console.log('[08] pattern indices [0,2]:', r6.maxLevel)

  await snapshot('pattern-after')

  filewrite({
    wholePattern: { maxLevel: r1.maxLevel, msgs: r1.messages },
    index0: { maxLevel: r2.maxLevel, msgs: r2.messages },
    index1: { maxLevel: r3.maxLevel, msgs: r3.messages },
    index2: { maxLevel: r4.maxLevel, msgs: r4.messages },
    index3OOR: { maxLevel: r5.maxLevel, msgs: r5.messages },
    indices02: { maxLevel: r6.maxLevel, msgs: r6.messages },
  }, 'pattern-results')

  return { partId }
}
