// keepTools: true — tool should remain after intersection
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IntersectionKeepTools' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 80, height: 60
  })).result

  const box2 = (await api.v1.solid.box({
    id: eifId, length: 60, width: 40, height: 80,
    translation: [60, 30, -10]
  })).result

  console.log('[03] box1:', box1, 'box2:', box2)

  const r = await api.v1.solid.intersection({ id: eifId, target: box1, tools: [box2], keepTools: true })
  console.log('[03] keepTools result:', r.result)
  console.log('[03] maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'keeptools-response')

  // Verify tool is still valid by copying it
  const copyR = await api.v1.solid.copy({ id: eifId, solid: box2 })
  console.log('[03] box2 copy after keepTools:', copyR.result, 'maxLevel:', copyR.maxLevel)

  await snapshot('after-keeptools')

  return { partId, result: r.result }
}
