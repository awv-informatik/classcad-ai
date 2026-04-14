// Intersection with multiple tools at once
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IntersectionMultiTools' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Large target box
  const target = (await api.v1.solid.box({
    id: eifId, length: 120, width: 120, height: 120
  })).result

  // Two overlapping tool boxes — both partially overlap target
  const tool1 = (await api.v1.solid.box({
    id: eifId, length: 80, width: 80, height: 150,
    translation: [20, 20, -15]
  })).result

  const tool2 = (await api.v1.solid.box({
    id: eifId, length: 80, width: 80, height: 150,
    translation: [40, 0, -15]
  })).result

  console.log('[06] target:', target, 'tool1:', tool1, 'tool2:', tool2)
  await snapshot('before')

  const r = await api.v1.solid.intersection({ id: eifId, target, tools: [tool1, tool2] })
  console.log('[06] multi-tool result:', r.result)
  console.log('[06] maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'multi-tools-response')

  await snapshot('after')

  return { partId, result: r.result }
}
