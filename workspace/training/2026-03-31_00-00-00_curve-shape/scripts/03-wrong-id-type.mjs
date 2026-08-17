// 03 — Error cases: wrong ID type, non-existent ID, missing id
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Pass part ID instead of EI ID
  const r1 = await api.v1.curve.shape({ id: partId })
  console.log('[03] partId as id — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[03] messages:', JSON.stringify(r1.messages))

  // Pass non-existent ID
  const r2 = await api.v1.curve.shape({ id: 99999 })
  console.log('[03] nonexistent id — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[03] messages:', JSON.stringify(r2.messages))

  // Missing id param entirely
  const r3 = await api.v1.curve.shape({})
  console.log('[03] missing id — result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[03] messages:', JSON.stringify(r3.messages))

  filewrite({
    partIdAsId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    nonexistentId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    missingId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }
  }, 'error-cases')

  return {}
}
