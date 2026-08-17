// 03 — updateDimension on ANGLE and ANGLEOX dimensions
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two lines for ANGLE
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 60, 0] })).result

  // Create ANGLE dimension
  const angleDimId = (await api.v1.sketch.dimension({
    id: skId, type: 'ANGLE', geomIds: [l1, l2], dimPos: [30, 15, 0]
  })).result
  console.log('[03] angleDimId:', angleDimId)

  // Update ANGLE — note: value is in radians
  const r1 = await api.v1.sketch.updateDimension({ id: angleDimId, value: Math.PI / 4 })
  console.log('[03] ANGLE update result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'angle-update')

  // Single line for ANGLEOX
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [0, -40, 0], endPos: [50, -20, 0] })).result
  const angleoxDimId = (await api.v1.sketch.dimension({ id: skId, type: 'ANGLEOX', geomIds: [l3] })).result
  console.log('[03] angleoxDimId:', angleoxDimId)

  // Update ANGLEOX — radians
  const r2 = await api.v1.sketch.updateDimension({ id: angleoxDimId, value: Math.PI / 6 })
  console.log('[03] ANGLEOX update result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'angleox-update')

  // Try string value like '45deg' — does it work with updateDimension?
  const r3 = await api.v1.sketch.updateDimension({ id: angleDimId, value: '60deg' })
  console.log('[03] ANGLE string update result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'angle-string-update')

  await snapshot('after-updates')
  return { partId }
}
