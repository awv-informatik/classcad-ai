// 05 — Fillet with large radius (too large for the edge geometry)
// Box is 80x60x40. Try radius=35 on a height-40 edge — should fail or clamp.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LargeRadiusFillet' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  // Get one vertical edge (height=40)
  const edgeR = await api.v1.part.getBrepGeometryByIndex({ id: eifId, lineIndex: 0 })
  const edgeId = edgeR.result

  // Try radius=35 — larger than half the smallest adjacent face dimension
  const r1 = await api.v1.solid.fillet({ id: eifId, radius: 35, geomIds: [edgeId] })
  console.log('[05] radius=35 result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) {
    for (const m of r1.messages) {
      console.log(`[05] message: level=${m.level} code=${m.code} msg="${m.message}"`)
    }
  }
  filewrite({ radius: 35, result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'large-radius-response')

  await snapshot('large-radius')

  return { partId, eifId, boxId }
}
