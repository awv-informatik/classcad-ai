// Target completely envelops tool — result should be the tool shape
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IntersectionTargetEnvelops' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Large box (target) fully contains small box (tool)
  const large = (await api.v1.solid.box({
    id: eifId, length: 100, width: 100, height: 100
  })).result

  const small = (await api.v1.solid.box({
    id: eifId, length: 30, width: 30, height: 30,
    translation: [20, 20, 20]
  })).result

  // Reference body for scale
  const ref = (await api.v1.solid.cylinder({
    id: eifId, height: 10, diameter: 10,
    translation: [-30, 0, 0]
  })).result

  console.log('[05] large (target):', large, 'small (tool):', small, 'ref:', ref)
  await snapshot('before')

  const r = await api.v1.solid.intersection({ id: eifId, target: large, tools: [small] })
  console.log('[05] target-envelops-tool result:', r.result)
  console.log('[05] maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'target-envelops-response')
  await snapshot('after')

  return { partId, result: r.result }
}
