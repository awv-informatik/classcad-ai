// 18 — Retest keepTools with correct copy syntax (target, not solid).
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'KeepToolsRetest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({ id: eifId, length: 100, width: 60, height: 40 })).result
  const box2 = (await api.v1.solid.box({
    id: eifId, length: 60, width: 40, height: 80, translation: [60, 30, 0]
  })).result

  console.log('[18] box1:', box1, 'box2:', box2)

  // Merge with keepTools=true
  const r = await api.v1.solid.merge({ id: eifId, target: box1, tools: [box2], keepTools: true })
  console.log('[18] merge keepTools=true result:', r.result, 'maxLevel:', r.maxLevel)

  // Try to copy box2 (the tool) with correct syntax
  const copyR = await api.v1.solid.copy({ id: eifId, target: box2 })
  console.log('[18] copy tool box2:', copyR.result, 'maxLevel:', copyR.maxLevel)
  if (copyR.messages?.length) console.log('[18] copy msgs:', JSON.stringify(copyR.messages))

  // Also try without keepTools for comparison
  const eif2 = (await api.v1.part.entityInjection({ id: partId })).result
  const box3 = (await api.v1.solid.box({ id: eif2, length: 100, width: 60, height: 40 })).result
  const box4 = (await api.v1.solid.box({
    id: eif2, length: 60, width: 40, height: 80, translation: [60, 30, 0]
  })).result

  const r2 = await api.v1.solid.merge({ id: eif2, target: box3, tools: [box4] })
  console.log('[18] merge keepTools=false result:', r2.result, 'maxLevel:', r2.maxLevel)

  const copyR2 = await api.v1.solid.copy({ id: eif2, target: box4 })
  console.log('[18] copy tool box4 (no keepTools):', copyR2.result, 'maxLevel:', copyR2.maxLevel)
  if (copyR2.messages?.length) console.log('[18] copy msgs:', JSON.stringify(copyR2.messages))

  await snapshot('keeptools-retest')

  return { partId }
}
