// Test naming a constraint and batch creation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create some lines
  const line1Id = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  const line2Id = (await api.v1.sketch.line({
    id: skId, startPos: [0, 20, 0], endPos: [50, 25, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  console.log('[14] line1Id:', line1Id, 'line2Id:', line2Id)

  // Named constraint
  const r1 = await api.v1.sketch.constraint({
    id: skId, name: 'MyHoriz', type: 'HORIZONTAL', geomIds: [line1Id],
  })
  console.log('[14] named constraint result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Batch creation — multiple constraints in one call
  const rBatch = await api.v1.sketch.constraint([
    { id: skId, type: 'HORIZONTAL', geomIds: [line2Id] },
    { id: skId, type: 'PARALLEL', geomIds: [line1Id, line2Id] },
  ])
  console.log('[14] batch result:', JSON.stringify(rBatch.result), 'maxLevel:', rBatch.maxLevel)
  console.log('[14] batch messages:', JSON.stringify(rBatch.messages))

  filewrite({
    named: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    batch: { result: rBatch.result, messages: rBatch.messages, maxLevel: rBatch.maxLevel },
  }, 'named-batch-response')

  await snapshot('named-batch')
  return { partId }
}
