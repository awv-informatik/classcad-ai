// 16 — Fillet on a cone (has arc edges at top/bottom and a seam line)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeFillet' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const coneId = (await api.v1.solid.cone({
    id: eifId, height: 60, bDiameter: 40, tDiameter: 15
  })).result
  console.log('[16] coneId:', coneId)

  // Enumerate edges
  const lines = []
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: eifId, lineIndex: i })
    if (r.result && r.maxLevel <= 31) lines.push(r.result)
    else break
  }
  const arcs = []
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: eifId, arcIndex: i })
    if (r.result && r.maxLevel <= 31) arcs.push(r.result)
    else break
  }
  console.log('[16] lines:', lines.length, JSON.stringify(lines))
  console.log('[16] arcs:', arcs.length, JSON.stringify(arcs))

  await snapshot('before')

  // Fillet the bottom (larger) arc edge
  if (arcs.length > 0) {
    // Get positions to find the bottom edge
    const posR = await api.v1.part.getGeometryPositions({ elems: arcs })
    for (const e of posR.result) {
      console.log(`[16] arc ${e.id}: z=${e.positions[0]?.z}`)
    }

    // Fillet bottom arc
    const bottomArc = posR.result.find(e => e.positions[0]?.z < 0)
    if (bottomArc) {
      const r = await api.v1.solid.fillet({ id: eifId, radius: 5, geomIds: [bottomArc.id] })
      console.log('[16] fillet result:', r.result, 'maxLevel:', r.maxLevel)
      filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'cone-fillet-response')
    }
  }

  await snapshot('after')

  return { partId, eifId, coneId }
}
