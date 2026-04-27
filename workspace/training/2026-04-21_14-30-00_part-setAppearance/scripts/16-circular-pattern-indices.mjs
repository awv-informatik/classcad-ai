export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CircPatTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 20, width: 15, height: 10, translation: [40, 0, 0] })).result

  // Create a work axis for circular pattern
  const waId = (await api.v1.part.workAxis({ id: partId, name: 'CenterAxis', origin: [0, 0, 0], direction: [0, 0, 1] })).result

  // Create circular pattern (4 instances, 360 degrees)
  const cpId = (await api.v1.part.circularPattern({
    id: partId,
    name: 'CP1',
    targets: [boxId],
    axis: { references: [waId] },
    count: 4,
    angle: 6.2832, // full 360
  })).result
  console.log('[16] cpId:', cpId)

  await snapshot('circ-pattern-before')

  // Color individual pattern instances by index
  const r0 = await api.v1.part.setAppearance({ target: { id: cpId, indices: [0] }, color: [255, 0, 0] })
  const r1 = await api.v1.part.setAppearance({ target: { id: cpId, indices: [1] }, color: [0, 255, 0] })
  const r2 = await api.v1.part.setAppearance({ target: { id: cpId, indices: [2] }, color: [0, 0, 255] })
  const r3 = await api.v1.part.setAppearance({ target: { id: cpId, indices: [3] }, color: [255, 255, 0] })
  console.log('[16] idx0:', r0.maxLevel, 'idx1:', r1.maxLevel, 'idx2:', r2.maxLevel, 'idx3:', r3.maxLevel)

  // OOR index [4]
  const r4 = await api.v1.part.setAppearance({ target: { id: cpId, indices: [4] }, color: [128, 128, 128] })
  console.log('[16] idx4 (OOR):', r4.maxLevel)
  if (r4.messages?.length) console.log('[16] idx4 msgs:', JSON.stringify(r4.messages))

  await snapshot('circ-pattern-after')

  filewrite({
    idx0: { maxLevel: r0.maxLevel }, idx1: { maxLevel: r1.maxLevel },
    idx2: { maxLevel: r2.maxLevel }, idx3: { maxLevel: r3.maxLevel },
    idx4OOR: { maxLevel: r4.maxLevel, msgs: r4.messages },
  }, 'circ-pattern-results')

  return { partId }
}
