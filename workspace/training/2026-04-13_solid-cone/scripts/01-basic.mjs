// Basic cone creation — happy path with required params only
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const r = await api.v1.solid.cone({ id: eifId, height: 100, bDiameter: 60, tDiameter: 20 })
  console.log('[01] cone result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  await snapshot('basic-cone')
  return { partId, eifId, coneId: r.result }
}
