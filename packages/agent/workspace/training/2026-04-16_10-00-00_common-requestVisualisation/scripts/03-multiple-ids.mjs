// Test requestVisualisation with multiple solid IDs and feature IDs
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VisMulti' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const box1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 50, translation: [80, 0, 0] })).result
  const sph = (await api.v1.solid.sphere({ id: eifId, radius: 20, translation: [0, 80, 0] })).result

  console.log('[03] box1:', box1, 'box2:', box2, 'sph:', sph)

  // Request vis for all three solids at once
  const r = await api.v1.common.requestVisualisation({ ids: [box1, box2, sph] })
  console.log('[03] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03] container count:', r.graphic.containers.length)

  const summaries = r.graphic.containers.map((c, i) => ({
    index: i,
    id: c.id,
    owner: c.owner,
    type: c.type,
    color: c.properties.material.color,
    opacity: c.properties.material.opacity,
    min: c.properties.min,
    max: c.properties.max,
    meshCount: c.meshes ? c.meshes.length : 0,
    edgeCount: c.edges ? c.edges.length : 0,
  }))
  console.log('[03] containers summary:', JSON.stringify(summaries, null, 2))
  filewrite(summaries, 'multi-containers')

  // Now try with feature ID instead of solid IDs
  const rFeat = await api.v1.common.requestVisualisation({ ids: [eifId] })
  console.log('[03] feature-level container count:', rFeat.graphic.containers.length)
  filewrite(
    rFeat.graphic.containers.map((c) => ({ id: c.id, owner: c.owner, type: c.type })),
    'feature-level-containers'
  )

  // Try with part ID
  const rPart = await api.v1.common.requestVisualisation({ ids: [partId] })
  console.log('[03] part-level container count:', rPart.graphic ? rPart.graphic.containers.length : 'no graphic')

  await snapshot('multi')
  return { partId, eifId, box1, box2, sph }
}
