// Test diagonal normal — slice at an angle
// Normal [1,0,1] (45° between X and Z) through the center
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceDiag' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  console.log('[09] boxId:', boxId)

  // Slice diagonally through center
  const r = await api.v1.solid.slice({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [1, 0, 1],
    keepBoth: false,
  })
  console.log('[09] slice result:', r.result, 'maxLevel:', r.maxLevel)

  const c = r.graphic?.containers?.[0]
  if (c) {
    console.log('[09] AFTER min:', JSON.stringify(c.properties.min))
    console.log('[09] AFTER max:', JSON.stringify(c.properties.max))
    console.log('[09] mesh count:', c.meshes?.length)
    console.log('[09] vert count:', c.meshes?.reduce((n, m) => n + (m.vertices?.length || 0) / 3, 0))
  }
  filewrite({ bbox: c ? { min: c.properties.min, max: c.properties.max } : null }, 'diag-bbox')

  await snapshot('diagonal-slice')

  return { partId, boxId }
}
