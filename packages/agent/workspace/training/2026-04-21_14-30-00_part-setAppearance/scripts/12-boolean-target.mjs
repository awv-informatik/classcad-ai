export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoolTest' })).result
  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 60, width: 40, height: 30 })).result
  const cyl1 = (await api.v1.part.cylinder({ id: partId, name: 'Tool', diameter: 20, height: 40, translation: [30, 20, -5] })).result

  // Create boolean subtraction
  const boolId = (await api.v1.part.boolean({
    id: partId,
    name: 'BoolSub',
    type: 'SUBTRACTION',
    target: [box1],
    tools: [cyl1],
  })).result
  console.log('[12] boolId:', boolId)

  await snapshot('boolean-before-color')

  // Color the boolean feature
  const r1 = await api.v1.part.setAppearance({ target: boolId, color: [200, 50, 50], transparency: 0.2 })
  console.log('[12] boolean color:', r1.maxLevel)
  if (r1.messages?.length) console.log('[12] bool msgs:', JSON.stringify(r1.messages))

  // Try coloring the original box feature (now consumed by boolean)
  const r2 = await api.v1.part.setAppearance({ target: box1, color: [0, 200, 0] })
  console.log('[12] consumed box1 color:', r2.maxLevel)
  if (r2.messages?.length) console.log('[12] consumed box1 msgs:', JSON.stringify(r2.messages))

  // Try coloring the tool feature (also consumed)
  const r3 = await api.v1.part.setAppearance({ target: cyl1, color: [0, 0, 200] })
  console.log('[12] consumed cyl1 color:', r3.maxLevel)
  if (r3.messages?.length) console.log('[12] consumed cyl1 msgs:', JSON.stringify(r3.messages))

  await snapshot('boolean-after-color')

  filewrite({
    booleanFeature: { maxLevel: r1.maxLevel, msgs: r1.messages },
    consumedBox: { maxLevel: r2.maxLevel, msgs: r2.messages },
    consumedCyl: { maxLevel: r3.maxLevel, msgs: r3.messages },
  }, 'boolean-results')

  return { partId }
}
