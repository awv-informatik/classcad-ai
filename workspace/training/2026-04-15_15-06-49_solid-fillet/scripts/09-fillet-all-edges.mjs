// 09 — Fillet ALL 12 edges of a box
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AllEdgeFillet' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  const allEdges = []
  for (let i = 0; i < 12; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: eifId, lineIndex: i })
    if (r.result && r.maxLevel <= 31) allEdges.push(r.result)
  }
  console.log('[09] edge count:', allEdges.length)

  await snapshot('before')

  const r = await api.v1.solid.fillet({ id: eifId, radius: 10, geomIds: allEdges })
  console.log('[09] fillet result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) {
    for (const m of r.messages) console.log(`[09] msg: level=${m.level} "${m.message}"`)
  }
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'all-edges-response')

  const containers = r.graphic?.containers || []
  for (const c of containers) {
    console.log(`[09] container: id=${c.id}, verts=${c.vertices?.length || 0}`)
  }

  await snapshot('after-all-filleted')

  return { partId, eifId, boxId }
}
