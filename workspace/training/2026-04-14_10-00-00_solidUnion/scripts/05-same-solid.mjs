// 05 — What happens when target = tool (same solid)?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UnionSameSolid' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({
    id: eifId, length: 80, width: 60, height: 40
  })).result

  console.log('[05] box1:', box1)

  // Try: union box1 with itself
  const r = await api.v1.solid.union({ id: eifId, target: box1, tools: [box1] })
  console.log('[05] self-union result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'self-union-response')

  await snapshot('after-self-union')

  return { partId, eifId }
}
