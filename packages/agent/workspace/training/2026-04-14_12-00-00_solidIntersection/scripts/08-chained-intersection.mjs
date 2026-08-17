// Chained intersections — intersect result with another solid
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IntersectionChained' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Large target
  const target = (await api.v1.solid.box({
    id: eifId, length: 100, width: 100, height: 100
  })).result

  // First tool — tall box offset in X
  const tool1 = (await api.v1.solid.box({
    id: eifId, length: 80, width: 120, height: 120,
    translation: [20, -10, -10]
  })).result

  console.log('[08] target:', target, 'tool1:', tool1)

  // First intersection
  const r1 = await api.v1.solid.intersection({ id: eifId, target, tools: [tool1] })
  console.log('[08] first intersection result:', r1.result, 'maxLevel:', r1.maxLevel)

  await snapshot('after-first')

  // Second tool — wide box offset in Y
  const tool2 = (await api.v1.solid.box({
    id: eifId, length: 120, width: 60, height: 120,
    translation: [-10, 20, -10]
  })).result

  // Chain — intersect the result with tool2
  const r2 = await api.v1.solid.intersection({ id: eifId, target, tools: [tool2] })
  console.log('[08] second intersection result:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({ first: { result: r1.result, maxLevel: r1.maxLevel }, second: { result: r2.result, maxLevel: r2.maxLevel } }, 'chained-response')

  await snapshot('after-second')

  return { partId, result: r2.result }
}
