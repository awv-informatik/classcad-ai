// Test: CUSTOM with offset — translation vector
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Offset along X only
  const r1 = await api.v1.part.workCSys({ id: partId, name: 'CS_offX', offset: [50, 0, 0] })
  console.log('[02] offX result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Offset along all axes
  const r2 = await api.v1.part.workCSys({ id: partId, name: 'CS_offXYZ', offset: [100, 100, 50] })
  console.log('[02] offXYZ result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Negative offset
  const r3 = await api.v1.part.workCSys({ id: partId, name: 'CS_neg', offset: [-50, -50, -50] })
  console.log('[02] neg result:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    offX: { result: r1.result, maxLevel: r1.maxLevel },
    offXYZ: { result: r2.result, maxLevel: r2.maxLevel },
    neg: { result: r3.result, maxLevel: r3.maxLevel }
  }, 'offset-responses')

  await snapshot('offsets')
  return { partId }
}
