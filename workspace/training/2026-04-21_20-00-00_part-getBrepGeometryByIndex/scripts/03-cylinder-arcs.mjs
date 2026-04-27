export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, diameter: 40, height: 60 })).result
  await api.v1.common.recalc({})

  const arcs = []
  for (let i = 0; i < 4; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: cylId, arcIndex: i })
    console.log(`[03] arcIndex=${i}: result=${r.result}, maxLevel=${r.maxLevel}`)
    arcs.push({ arcIndex: i, result: r.result, maxLevel: r.maxLevel })
  }

  const faces = []
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: cylId, faceIndex: i })
    console.log(`[03] faceIndex=${i}: result=${r.result}, maxLevel=${r.maxLevel}`)
    faces.push({ faceIndex: i, result: r.result, maxLevel: r.maxLevel })
  }

  const lines = []
  for (let i = 0; i < 3; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: cylId, lineIndex: i })
    console.log(`[03] lineIndex=${i}: result=${r.result}, maxLevel=${r.maxLevel}`)
    lines.push({ lineIndex: i, result: r.result, maxLevel: r.maxLevel })
  }

  filewrite({ arcs, faces, lines }, 'cylinder-brep')
  await snapshot('cylinder')
  return { partId }
}
