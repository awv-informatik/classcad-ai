// Basic cylinder creation — happy path with required params only
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylinderTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const r = await api.v1.solid.cylinder({ id: eifId, height: 100, diameter: 50 })
  console.log('[01] cylinder result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  await snapshot('basic-cylinder')
  return { partId, eifId, cylinderId: r.result }
}
