// Error case: missing radius parameter only (no dangerous zero/negative values)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereMissing' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Missing radius
  const r1 = await api.v1.solid.sphere({ id: eifId })
  console.log('[07] missing radius — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[07] messages:', JSON.stringify(r1.messages))

  filewrite({
    missingRadius: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
  }, 'missing-radius')

  return { partId, eifId }
}
