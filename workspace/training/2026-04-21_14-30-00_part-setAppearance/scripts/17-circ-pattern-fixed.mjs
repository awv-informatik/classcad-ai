export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CircPatFix' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 20, width: 15, height: 10, translation: [40, 0, 0] })).result

  const waId = (await api.v1.part.workAxis({ id: partId, name: 'CenterAxis', origin: [0, 0, 0], direction: [0, 0, 1] })).result

  // Correct form: references at top level, not inside axis object
  const r = await api.v1.part.circularPattern({
    id: partId,
    name: 'CP1',
    targets: [{ id: boxId }],
    references: [waId],
    count: 4,
    angle: 1.5708, // 90 degrees between each
  })
  console.log('[17] circularPattern result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[17] cp msgs:', JSON.stringify(r.messages))

  const cpId = r.result
  if (cpId === null) {
    console.log('[17] ABORT: circularPattern returned null')
    return { partId }
  }

  await snapshot('circ-pattern')

  // Color individual instances
  const r0 = await api.v1.part.setAppearance({ target: { id: cpId, indices: [0] }, color: [255, 0, 0] })
  const r1 = await api.v1.part.setAppearance({ target: { id: cpId, indices: [1] }, color: [0, 255, 0] })
  const r2 = await api.v1.part.setAppearance({ target: { id: cpId, indices: [2] }, color: [0, 0, 255] })
  console.log('[17] idx0:', r0.maxLevel, 'idx1:', r1.maxLevel, 'idx2:', r2.maxLevel)

  // OOR
  const r3 = await api.v1.part.setAppearance({ target: { id: cpId, indices: [3] }, color: [128, 128, 128] })
  console.log('[17] idx3:', r3.maxLevel)
  if (r3.messages?.length) console.log('[17] idx3 msgs:', JSON.stringify(r3.messages))

  await snapshot('circ-colored')

  filewrite({
    cpResult: { result: cpId, maxLevel: r.maxLevel, msgs: r.messages },
    idx0: { maxLevel: r0.maxLevel }, idx1: { maxLevel: r1.maxLevel },
    idx2: { maxLevel: r2.maxLevel }, idx3: { maxLevel: r3.maxLevel, msgs: r3.messages },
  }, 'circ-fixed-results')

  return { partId }
}
