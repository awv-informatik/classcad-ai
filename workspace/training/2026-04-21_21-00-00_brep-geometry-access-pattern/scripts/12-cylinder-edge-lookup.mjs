export default async function (api, { snapshot, filewrite }) {
  // Investigate cylinder edge lookup — in script 06, standalone cylinder queries returned null
  const partId = (await api.v1.part.create({ name: 'CylLookup' })).result
  const cylId = (await api.v1.part.cylinder({
    id: partId,
    diameter: 30,
    height: 40,
  })).result
  await api.v1.common.recalc({})

  // Enumerate the cylinder's brep
  const lines = [], arcs = [], faces = [], points = []
  for (let i = 0; ; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: cylId, lineIndex: i })
    if (r.result === null) break
    lines.push(r.result)
  }
  for (let i = 0; ; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: cylId, arcIndex: i })
    if (r.result === null) break
    arcs.push(r.result)
  }
  for (let i = 0; ; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: cylId, faceIndex: i })
    if (r.result === null) break
    faces.push(r.result)
  }
  for (let i = 0; ; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: cylId, pointIndex: i })
    if (r.result === null) break
    points.push(r.result)
  }
  console.log('[12] cylinder brep: lines:', lines.length, 'arcs:', arcs.length, 'faces:', faces.length, 'points:', points.length)

  // Get positions for all elements
  const allElems = [...lines, ...arcs, ...faces, ...points]
  let positions = null
  if (allElems.length > 0) {
    positions = (await api.v1.part.getGeometryPositions({ elems: allElems })).result
    console.log('[12] positions for', allElems.length, 'elements:')
    positions?.forEach((p, i) => {
      const type = i < lines.length ? 'line' : i < lines.length + arcs.length ? 'arc' :
        i < lines.length + arcs.length + faces.length ? 'face' : 'point'
      console.log(`  [${type}] id=${p.id} positions=${JSON.stringify(p.positions)}`)
    })
  }

  // Try different query strategies on the cylinder
  const r = 15 // radius
  const h = 40
  const queries = {
    'circles-center-top': { circles: [{ pos: [0, 0, h] }] },
    'circles-rim-top': { circles: [{ pos: [-r, 0, h] }] },
    'circles-center-bottom': { circles: [{ pos: [0, 0, 0] }] },
    'arcs-center-top': { arcs: [{ pos: [0, 0, h] }] },
    'arcs-rim-top': { arcs: [{ pos: [-r, 0, h] }] },
    'lines-seam': { lines: [{ pos: [r, 0, h / 2] }] },
  }

  const results = {}
  for (const [name, params] of Object.entries(queries)) {
    const r = await api.v1.part.getGeometryIds({ id: partId, ...params })
    const key = Object.keys(params)[0]
    const found = r.result?.[key]?.[0]
    results[name] = {
      found: found === undefined ? 'undefined' : Array.isArray(found) ? '[]' : found,
      maxLevel: r.maxLevel,
    }
    console.log(`[12] ${name}: found=${results[name].found} maxLevel=${r.maxLevel}`)
  }

  // If we found arcs, can we fillet them?
  const arcId = arcs[0]
  if (arcId) {
    const filletR = await api.v1.part.fillet({
      id: partId,
      references: [arcId],
      radius: 5,
    })
    console.log('[12] fillet on cylinder arc:', filletR.result != null ? '✓' : '❌', 'maxLevel:', filletR.maxLevel)
    await snapshot('cylinder-filleted')
  }

  filewrite({
    brep: { lines, arcs, faces, points },
    positions,
    queries: results,
  }, 'cylinder-lookup')

  return { partId }
}
