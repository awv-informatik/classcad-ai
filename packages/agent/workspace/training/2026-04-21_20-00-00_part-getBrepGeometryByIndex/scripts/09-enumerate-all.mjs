export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Enumerate ALL brep elements by iterating until we hit null
  const enumerate = async (type, maxGuess = 20) => {
    const results = []
    for (let i = 0; i < maxGuess; i++) {
      const param = { id: boxId }
      param[type] = i
      const r = await api.v1.part.getBrepGeometryByIndex(param)
      if (r.result === null) break
      results.push({ index: i, id: r.result })
    }
    return results
  }

  const lines = await enumerate('lineIndex')
  const faces = await enumerate('faceIndex')
  const points = await enumerate('pointIndex')
  const arcs = await enumerate('arcIndex')
  const nurbs = await enumerate('nurbsCurveIndex')

  console.log(`[09] lines: ${lines.length} elements`)
  console.log(`[09] faces: ${faces.length} elements`)
  console.log(`[09] points: ${points.length} elements`)
  console.log(`[09] arcs: ${arcs.length} elements`)
  console.log(`[09] nurbs: ${nurbs.length} elements`)

  // Verify positions using getGeometryPositions for each line ID
  const lineIds = lines.map(l => l.id)
  const positions = []
  for (const lid of lineIds) {
    const r = await api.v1.part.getGeometryPositions({ id: partId, ids: [lid] })
    positions.push({ id: lid, positions: r.result })
  }

  filewrite({ lines, faces, points, arcs, nurbs, positions }, 'enumerated-all')
  await snapshot('box')
  return { partId }
}
