// 11 — Fillet edges on a boolean result (subtraction leaves new edges at the cut)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoolFillet' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create a box and subtract a cylinder from it
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.solid.cylinder({
    id: eifId, height: 60, diameter: 20,
    translation: [15, 10, 0]  // offset so the hole is visible
  })).result

  const subR = await api.v1.solid.subtraction({ id: eifId, target: boxId, tools: [cylId] })
  console.log('[11] subtraction result:', subR.result, 'maxLevel:', subR.maxLevel)

  // Now enumerate edges — should include the circular edges from the boolean cut
  const lines = []
  for (let i = 0; i < 20; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: eifId, lineIndex: i })
    if (r.result && r.maxLevel <= 31) lines.push(r.result)
    else break
  }
  const arcs = []
  for (let i = 0; i < 10; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: eifId, arcIndex: i })
    if (r.result && r.maxLevel <= 31) arcs.push(r.result)
    else break
  }
  console.log('[11] lines:', lines.length, 'arcs:', arcs.length)
  console.log('[11] arc IDs:', JSON.stringify(arcs))

  await snapshot('before-fillet')

  // Fillet the circular edges from the boolean cut (the arc edges)
  if (arcs.length > 0) {
    const r = await api.v1.solid.fillet({ id: eifId, radius: 3, geomIds: arcs })
    console.log('[11] fillet result:', r.result, 'maxLevel:', r.maxLevel)
    if (r.messages?.length) {
      for (const m of r.messages) console.log(`[11] msg: level=${m.level} "${m.message}"`)
    }
    filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'bool-fillet-response')
  }

  await snapshot('after-fillet')

  return { partId, eifId, boxId }
}
