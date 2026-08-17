// Edge case: very small and very large radii
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereSizes' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Very small radius
  const r1 = await api.v1.solid.sphere({ id: eifId, radius: 0.001 })
  console.log('[08] radius=0.001:', r1.result, 'maxLevel:', r1.maxLevel)

  // Very large radius
  const r2 = await api.v1.solid.sphere({ id: eifId, radius: 10000, translation: [20000, 0, 0] })
  console.log('[08] radius=10000:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    small: { result: r1.result, maxLevel: r1.maxLevel },
    large: { result: r2.result, maxLevel: r2.maxLevel },
  }, 'size-extremes')

  await snapshot('size-extremes')

  return { partId, eifId }
}
