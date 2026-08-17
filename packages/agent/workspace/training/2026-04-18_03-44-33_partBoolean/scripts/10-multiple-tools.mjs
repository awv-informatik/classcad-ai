export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiTool' })).result

  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 100, width: 80, height: 40 })).result
  const cyl1 = (await api.v1.part.cylinder({ id: partId, name: 'Hole1', diameter: 15, height: 60, translation: [20, 20, -10] })).result
  const cyl2 = (await api.v1.part.cylinder({ id: partId, name: 'Hole2', diameter: 15, height: 60, translation: [50, 40, -10] })).result
  const cyl3 = (await api.v1.part.cylinder({ id: partId, name: 'Hole3', diameter: 15, height: 60, translation: [80, 60, -10] })).result

  console.log('[10] box1:', box1, 'cyl1:', cyl1, 'cyl2:', cyl2, 'cyl3:', cyl3)
  await snapshot('before')

  // Subtract all 3 cylinders at once
  const r = await api.v1.part.boolean({
    id: partId,
    type: 'SUBTRACTION',
    target: box1,
    tools: [cyl1, cyl2, cyl3],
  })

  console.log('[10] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'multi-tool-response')

  await snapshot('after')
  return { partId }
}
