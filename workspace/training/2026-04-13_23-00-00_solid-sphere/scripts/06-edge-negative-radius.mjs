// Edge case: negative radius
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereNegRadius' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const r = await api.v1.solid.sphere({ id: eifId, radius: -30 })
  console.log('[06] radius=-30 result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'negative-radius')

  return { partId, eifId }
}
