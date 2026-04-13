export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MissingParams' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Missing height
  const r1 = await api.v1.solid.box({ id: eifId, length: 50, width: 50 })
  console.log('[07] missing height:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[07] messages:', JSON.stringify(r1.messages))

  // Missing all dimensions
  const r2 = await api.v1.solid.box({ id: eifId })
  console.log('[07] missing all dims:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[07] messages:', JSON.stringify(r2.messages))

  // Wrong id type — passing partId instead of eifId
  const r3 = await api.v1.solid.box({ id: partId, length: 50, width: 50, height: 50 })
  console.log('[07] wrong id (partId):', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[07] messages:', JSON.stringify(r3.messages))

  filewrite({
    missingHeight: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    missingAll: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    wrongId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'missing-params')

  return { partId }
}
