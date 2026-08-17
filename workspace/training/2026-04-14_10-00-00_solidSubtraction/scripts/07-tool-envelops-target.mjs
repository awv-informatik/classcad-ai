// Test: tool completely envelops the target (should destroy the target?)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SubEnvelop' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Small target
  const small = (await api.v1.solid.box({
    id: eifId, length: 20, width: 20, height: 20,
    translation: [40, 30, 10]
  })).result

  // Large tool that completely contains the target
  const big = (await api.v1.solid.box({
    id: eifId, length: 100, width: 80, height: 60
  })).result

  console.log('[07] small target:', small, 'big tool:', big)
  await snapshot('before')

  const r = await api.v1.solid.subtraction({ id: eifId, target: small, tools: [big] })
  console.log('[07] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[07] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'envelop-result')

  await snapshot('after')

  return { partId }
}
