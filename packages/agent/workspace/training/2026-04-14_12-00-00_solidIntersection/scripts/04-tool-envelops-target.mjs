// Tool completely envelops target — target should be unchanged (it IS the intersection)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IntersectionEnvelop' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Small box (target) fully inside large box (tool)
  const small = (await api.v1.solid.box({
    id: eifId, length: 30, width: 30, height: 30,
    translation: [20, 20, 20]
  })).result

  const large = (await api.v1.solid.box({
    id: eifId, length: 100, width: 100, height: 100
  })).result

  console.log('[04] small (target):', small, 'large (tool):', large)
  await snapshot('before')

  const r = await api.v1.solid.intersection({ id: eifId, target: small, tools: [large] })
  console.log('[04] tool-envelops-target result:', r.result)
  console.log('[04] maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'envelop-response')
  await snapshot('after')

  return { partId, result: r.result }
}
