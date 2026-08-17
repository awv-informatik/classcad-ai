// Test reading back per-solid appearance (indices) via requestVisualisation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VisPerSolid' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const box1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 50, translation: [80, 0, 0] })).result

  // Set different colors per solid via indices
  await api.v1.common.setAppearance({ target: { id: eifId, indices: [0] }, color: [255, 0, 0] })
  await api.v1.common.setAppearance({ target: { id: eifId, indices: [1] }, color: [0, 0, 255], transparency: 0.3 })

  // Read back both solids
  const r = await api.v1.common.requestVisualisation({ ids: [box1, box2] })
  console.log('[09] container count:', r.graphic.containers.length)

  r.graphic.containers.forEach((c, i) => {
    console.log(`[09] container[${i}]: id=${c.id} owner=${c.owner} color=${JSON.stringify(c.properties.material.color)} opacity=${c.properties.material.opacity}`)
  })

  filewrite(r.graphic.containers.map(c => ({
    id: c.id,
    owner: c.owner,
    color: c.properties.material.color,
    opacity: c.properties.material.opacity,
  })), 'per-solid-appearance')

  await snapshot('per-solid')
  return { partId }
}
