// Test error cases: wrong geomIds count, wrong type, redundant constraint
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineId = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  console.log('[15] lineId:', lineId)

  // Error: PARALLEL with only one line
  const r1 = await api.v1.sketch.constraint({
    id: skId, type: 'PARALLEL', geomIds: [lineId],
  })
  console.log('[15] parallel-one-line result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[15] parallel-one-line messages:', JSON.stringify(r1.messages))

  // Error: invalid type
  const r2 = await api.v1.sketch.constraint({
    id: skId, type: 'INVALID_TYPE', geomIds: [lineId],
  })
  console.log('[15] invalid-type result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[15] invalid-type messages:', JSON.stringify(r2.messages))

  // Apply HORIZONTAL then apply it again (redundant)
  const r3 = await api.v1.sketch.constraint({
    id: skId, type: 'HORIZONTAL', geomIds: [lineId],
  })
  console.log('[15] first horizontal result:', r3.result, 'maxLevel:', r3.maxLevel)
  const r4 = await api.v1.sketch.constraint({
    id: skId, type: 'HORIZONTAL', geomIds: [lineId],
  })
  console.log('[15] redundant horizontal result:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[15] redundant messages:', JSON.stringify(r4.messages))

  filewrite({
    parallelOneLine: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    invalidType: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
    firstHorizontal: { result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel },
    redundantHorizontal: { result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel },
  }, 'error-cases-response')

  return { partId }
}
