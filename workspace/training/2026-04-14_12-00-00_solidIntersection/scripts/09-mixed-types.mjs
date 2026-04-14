// Intersection of box with cylinder — realistic usage, mixed solid types
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IntersectionMixed' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Box target
  const box = (await api.v1.solid.box({
    id: eifId, length: 80, width: 80, height: 80
  })).result

  // Cylinder tool — partially overlapping
  const cyl = (await api.v1.solid.cylinder({
    id: eifId, height: 120, diameter: 60,
    translation: [40, 40, -20]
  })).result

  console.log('[09] box:', box, 'cyl:', cyl)
  await snapshot('before')

  const r = await api.v1.solid.intersection({ id: eifId, target: box, tools: [cyl] })
  console.log('[09] mixed intersection result:', r.result)
  console.log('[09] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'mixed-types-response')

  await snapshot('after')

  return { partId, result: r.result }
}
