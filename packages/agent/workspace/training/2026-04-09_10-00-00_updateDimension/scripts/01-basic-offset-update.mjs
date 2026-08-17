// 01 — Basic updateDimension on OFFSET with numeric value. Capture full return envelope.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two horizontal lines to dimension between
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 40, 0], endPos: [80, 40, 0] })).result

  // Create OFFSET dimension between the two lines (auto-calculated value = 40)
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1, l2] })).result
  console.log('[01] dimId:', dimId)

  // Now update to 60
  const r = await api.v1.sketch.updateDimension({ id: dimId, value: 60 })
  console.log('[01] updateDimension result:', r.result)
  console.log('[01] updateDimension maxLevel:', r.maxLevel)
  console.log('[01] updateDimension messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-response')

  // Update again to 25
  const r2 = await api.v1.sketch.updateDimension({ id: dimId, value: 25 })
  console.log('[01] second update result:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'second-update-response')

  await snapshot('after-updates')
  return { partId, dimId }
}
