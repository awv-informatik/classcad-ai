// Edge cases: empty array, invalid ID, zero translation, no translation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeCases' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  console.log('[08] line1:', line1)

  // Test 1: empty geomIds
  const r1 = await api.v1.sketch.copyGeometry({
    id: skId,
    geomIds: [],
    translation: [0, 30, 0]
  })
  console.log('[08] empty geomIds:', r1.result, 'maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))

  // Test 2: invalid ID (9999)
  const r2 = await api.v1.sketch.copyGeometry({
    id: skId,
    geomIds: [9999],
    translation: [0, 30, 0]
  })
  console.log('[08] invalid ID:', r2.result, 'maxLevel:', r2.maxLevel, 'messages:', JSON.stringify(r2.messages))

  // Test 3: zero translation [0,0,0]
  const r3 = await api.v1.sketch.copyGeometry({
    id: skId,
    geomIds: [line1],
    translation: [0, 0, 0],
    doCopyConstraints: false
  })
  console.log('[08] zero translation:', r3.result, 'maxLevel:', r3.maxLevel)

  // Test 4: missing translation param entirely
  try {
    const r4 = await api.v1.sketch.copyGeometry({
      id: skId,
      geomIds: [line1],
      doCopyConstraints: false
    })
    console.log('[08] no translation:', r4.result, 'maxLevel:', r4.maxLevel, 'messages:', JSON.stringify(r4.messages))
  } catch (e) {
    console.log('[08] no translation error:', e.message)
  }

  filewrite({
    emptyGeomIds: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    invalidId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    zeroTranslation: { result: r3.result, maxLevel: r3.maxLevel },
  }, 'edge-cases')

  await snapshot('after-edge-cases')
  return { partId }
}
