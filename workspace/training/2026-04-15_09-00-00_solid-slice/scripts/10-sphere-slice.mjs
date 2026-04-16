// Test slicing a sphere — does it work on non-box shapes?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceSphere' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 30 })).result
  console.log('[10] sphId:', sphId)

  // Slice sphere at y=10 — should create a dome shape
  const r = await api.v1.solid.slice({
    id: eifId,
    target: sphId,
    originPos: [0, 10, 0],
    normal: [0, 1, 0],
    keepBoth: false,
  })
  console.log('[10] result:', r.result, 'maxLevel:', r.maxLevel)

  const c = r.graphic?.containers?.[0]
  if (c) {
    console.log('[10] AFTER min:', JSON.stringify(c.properties.min))
    console.log('[10] AFTER max:', JSON.stringify(c.properties.max))
  }
  filewrite({ bbox: c ? { min: c.properties.min, max: c.properties.max } : null, result: r.result, maxLevel: r.maxLevel }, 'sphere-slice')

  await snapshot('sphere-sliced')

  return { partId, sphId }
}
