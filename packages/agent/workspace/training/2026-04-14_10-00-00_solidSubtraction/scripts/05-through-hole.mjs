// Test through-hole: cylinder completely passes through a box
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SubThroughHole' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box = (await api.v1.solid.box({
    id: eifId, length: 100, width: 80, height: 40
  })).result

  // Cylinder goes fully through the box in Z
  const cyl = (await api.v1.solid.cylinder({
    id: eifId, height: 80, diameter: 25,
    translation: [50, 40, -20]
  })).result

  console.log('[05] target:', box, 'tool:', cyl)
  await snapshot('before')

  const r = await api.v1.solid.subtraction({ id: eifId, target: box, tools: [cyl] })
  console.log('[05] result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('after')

  filewrite({ result: r.result, maxLevel: r.maxLevel }, 'through-hole-result')

  return { partId }
}
