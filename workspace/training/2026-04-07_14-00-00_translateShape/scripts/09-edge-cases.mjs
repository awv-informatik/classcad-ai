// Edge cases: zero vector, negative values, empty shape, missing params
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeCases' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test 1: zero vector translation
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Zero' })).result
  await api.v1.curve.line({ id: s1, startPos: [0, 0, 0], endPos: [10, 0, 0] })
  const r1 = await api.v1.curve.translateShape({ id: s1, translation: [0, 0, 0] })
  console.log('[09] zero vector:', r1.maxLevel, JSON.stringify(r1.messages))

  // Test 2: negative values
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Negative' })).result
  await api.v1.curve.line({ id: s2, startPos: [50, 50, 0], endPos: [60, 50, 0] })
  const r2 = await api.v1.curve.translateShape({ id: s2, translation: [-30, -20, -10] })
  console.log('[09] negative:', r2.maxLevel, JSON.stringify(r2.messages))

  // Test 3: empty shape (no curves)
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'Empty' })).result
  const r3 = await api.v1.curve.translateShape({ id: s3, translation: [10, 0, 0] })
  console.log('[09] empty shape:', r3.maxLevel, JSON.stringify(r3.messages))

  // Test 4: missing translation param
  const s4 = (await api.v1.curve.shape({ id: eifId, name: 'MissingParam' })).result
  await api.v1.curve.line({ id: s4, startPos: [0, 0, 0], endPos: [10, 0, 0] })
  const r4 = await api.v1.curve.translateShape({ id: s4 })
  console.log('[09] missing translation:', r4.maxLevel, JSON.stringify(r4.messages))

  // Test 5: invalid shape ID
  const r5 = await api.v1.curve.translateShape({ id: 99999, translation: [10, 0, 0] })
  console.log('[09] invalid id:', r5.maxLevel, JSON.stringify(r5.messages))

  // Test 6: large values
  const s6 = (await api.v1.curve.shape({ id: eifId, name: 'Large' })).result
  await api.v1.curve.line({ id: s6, startPos: [0, 0, 0], endPos: [10, 0, 0] })
  const r6 = await api.v1.curve.translateShape({ id: s6, translation: [100000, 100000, 100000] })
  console.log('[09] large values:', r6.maxLevel, JSON.stringify(r6.messages))

  filewrite({
    zeroVector: { maxLevel: r1.maxLevel, messages: r1.messages },
    negative: { maxLevel: r2.maxLevel, messages: r2.messages },
    emptyShape: { maxLevel: r3.maxLevel, messages: r3.messages },
    missingTranslation: { maxLevel: r4.maxLevel, messages: r4.messages },
    invalidId: { maxLevel: r5.maxLevel, messages: r5.messages },
    largeValues: { maxLevel: r6.maxLevel, messages: r6.messages },
  }, 'edge-cases')

  return { partId }
}
