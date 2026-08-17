// Error cases: missing required params (id, radius)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereMissing' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Missing radius
  const r1 = await api.v1.solid.sphere({ id: eifId })
  console.log('[07] missing radius — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[07] messages:', JSON.stringify(r1.messages))

  // Wrong ID type (part ID instead of EIF ID)
  const r2 = await api.v1.solid.sphere({ id: partId, radius: 30 })
  console.log('[07] wrong id type — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[07] messages:', JSON.stringify(r2.messages))

  // Missing id entirely
  const r3 = await api.v1.solid.sphere({ radius: 30 })
  console.log('[07] missing id — result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[07] messages:', JSON.stringify(r3.messages))

  filewrite({
    missingRadius: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    wrongIdType: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
    missingId: { result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel },
  }, 'missing-params')

  return { partId, eifId }
}
