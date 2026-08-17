// Test: how many curves before snapshot invalidates shape ID?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Threshold' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const results = {}

  // Test with 1 line
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Lines1' })).result
  await api.v1.curve.line({ id: s1, startPos: [0, 0, 0], endPos: [10, 0, 0] })
  await snapshot('1line')
  const r1 = await api.v1.curve.translateShape({ id: s1, translation: [5, 0, 0] })
  results['1line'] = r1.maxLevel
  console.log('[14] 1 line:', r1.maxLevel)

  // Test with 2 lines
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Lines2' })).result
  await api.v1.curve.line({ id: s2, startPos: [0, 10, 0], endPos: [10, 10, 0] })
  await api.v1.curve.line({ id: s2, startPos: [10, 10, 0], endPos: [10, 20, 0] })
  await snapshot('2lines')
  const r2 = await api.v1.curve.translateShape({ id: s2, translation: [5, 0, 0] })
  results['2lines'] = r2.maxLevel
  console.log('[14] 2 lines:', r2.maxLevel)

  // Test with 3 lines
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'Lines3' })).result
  await api.v1.curve.line({ id: s3, startPos: [0, 30, 0], endPos: [10, 30, 0] })
  await api.v1.curve.line({ id: s3, startPos: [10, 30, 0], endPos: [10, 40, 0] })
  await api.v1.curve.line({ id: s3, startPos: [10, 40, 0], endPos: [0, 40, 0] })
  await snapshot('3lines')
  const r3 = await api.v1.curve.translateShape({ id: s3, translation: [5, 0, 0] })
  results['3lines'] = r3.maxLevel
  console.log('[14] 3 lines:', r3.maxLevel)

  // Test with 1 circle
  const s4 = (await api.v1.curve.shape({ id: eifId, name: 'OneCircle' })).result
  await api.v1.curve.circle({ id: s4, centerPos: [0, 60, 0], radius: 5 })
  await snapshot('1circle')
  const r4 = await api.v1.curve.translateShape({ id: s4, translation: [5, 0, 0] })
  results['1circle'] = r4.maxLevel
  console.log('[14] 1 circle:', r4.maxLevel)

  filewrite(results, 'threshold-results')
  return { partId }
}
