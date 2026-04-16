// 10 — Fillet edges from two different solids in one call
// Docs say "Edges can be of different solids" — test this.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CrossSolidFillet' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create two separate boxes
  const box1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.solid.box({
    id: eifId, length: 40, width: 30, height: 50,
    translation: [70, 0, 0]
  })).result
  console.log('[10] box1:', box1, 'box2:', box2)

  // Get one edge from each box
  // After creating 2 solids, the brep indices include both.
  // Enumerate edges and use getGeometryPositions to identify which belongs to which.
  const allEdges = []
  for (let i = 0; i < 30; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: eifId, lineIndex: i })
    if (r.result && r.maxLevel <= 31) allEdges.push(r.result)
    else break
  }
  console.log('[10] total edges:', allEdges.length)

  // Get positions
  const posR = await api.v1.part.getGeometryPositions({ elems: allEdges })
  filewrite(posR.result, 'edge-positions')

  // Pick one edge from each box:
  // box1 centered at origin: edges with |x| <= 30, |y| <= 20
  // box2 centered at (70,0,0): edges with x around 70
  let box1Edge = null
  let box2Edge = null
  for (const e of posR.result) {
    const p = e.positions[0]
    if (!box1Edge && Math.abs(p.x) <= 35 && Math.abs(p.y) <= 25) {
      box1Edge = e.id
    }
    if (!box2Edge && p.x > 40) {
      box2Edge = e.id
    }
  }
  console.log('[10] box1Edge:', box1Edge, 'box2Edge:', box2Edge)

  await snapshot('before')

  // Fillet one edge from each solid in a single call
  const r = await api.v1.solid.fillet({ id: eifId, radius: 5, geomIds: [box1Edge, box2Edge] })
  console.log('[10] fillet result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) {
    for (const m of r.messages) console.log(`[10] msg: level=${m.level} "${m.message}"`)
  }
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'cross-solid-response')

  await snapshot('after')

  return { partId, eifId }
}
