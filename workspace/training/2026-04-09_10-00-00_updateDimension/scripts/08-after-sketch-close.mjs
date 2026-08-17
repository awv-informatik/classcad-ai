// 08 — Can you updateDimension after sketch.close?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1] })).result
  console.log('[08] dimId:', dimId)

  // Close the sketch
  const closeR = await api.v1.sketch.close({ id: skId })
  console.log('[08] close result:', closeR.result, 'maxLevel:', closeR.maxLevel)

  // Try updateDimension after close
  const r1 = await api.v1.sketch.updateDimension({ id: dimId, value: 100 })
  console.log('[08] after-close result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'after-close')

  // Reopen sketch and try again
  const openR = await api.v1.sketch.open({ id: skId })
  console.log('[08] open result:', openR.result, 'maxLevel:', openR.maxLevel)

  const r2 = await api.v1.sketch.updateDimension({ id: dimId, value: 200 })
  console.log('[08] after-reopen result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'after-reopen')

  return { partId }
}
