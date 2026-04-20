export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoolUnion' })).result

  // Create two box features that overlap
  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Tool', length: 50, width: 40, height: 60, references: [], translation: [50, 20, 0] })).result

  console.log('[01] box1:', box1, 'box2:', box2)
  await snapshot('before')

  const r = await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    target: box1,
    tools: [box2],
  })

  console.log('[01] boolean result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'union-response')

  await snapshot('after')

  return { partId }
}
