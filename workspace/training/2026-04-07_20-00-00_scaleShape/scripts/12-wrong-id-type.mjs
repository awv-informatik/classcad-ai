// Test scaleShape with wrong ID types (EI ID, part ID)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WrongId' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Try with EI ID
  const r1 = await api.v1.curve.scaleShape({ id: eifId, factor: 2.0 })
  console.log('[12] EI ID result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[12] EI messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'ei-id-response')

  // Try with part ID
  const r2 = await api.v1.curve.scaleShape({ id: partId, factor: 2.0 })
  console.log('[12] part ID result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[12] part messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'part-id-response')

  return { partId }
}
