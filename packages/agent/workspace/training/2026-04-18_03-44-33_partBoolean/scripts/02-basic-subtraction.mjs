export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoolSubtract' })).result

  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Tool', length: 50, width: 40, height: 60, translation: [50, 20, -10] })).result

  console.log('[02] box1:', box1, 'box2:', box2)
  await snapshot('before')

  const r = await api.v1.part.boolean({
    id: partId,
    type: 'SUBTRACTION',
    target: box1,
    tools: [box2],
  })

  console.log('[02] boolean result:', r.result)
  console.log('[02] maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'subtraction-response')

  await snapshot('after')
  return { partId }
}
