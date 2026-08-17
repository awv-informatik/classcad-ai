export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create two cylinders at 90 degrees — their intersection should have NURBS edges
  const cyl1Id = (await api.v1.part.cylinder({ id: partId, diameter: 40, height: 100 })).result
  const cyl2Id = (await api.v1.part.cylinder({
    id: partId,
    diameter: 30,
    height: 100,
    translation: [0, 0, 20],
    rotation: [Math.PI / 2, 0, 0],
  })).result

  const boolId = (await api.v1.part.boolean({
    id: partId,
    name: 'CylBool',
    type: 'SUBTRACTION',
    target: cyl1Id,
    tools: [cyl2Id],
  })).result
  console.log(`[16] boolId: ${boolId}`)
  await api.v1.common.recalc({})

  if (boolId) {
    const enumerate = async (featureId, type, maxGuess = 20) => {
      const results = []
      for (let i = 0; i < maxGuess; i++) {
        const param = { id: featureId }
        param[type] = i
        const r = await api.v1.part.getBrepGeometryByIndex(param)
        if (r.result === null) break
        results.push({ index: i, id: r.result })
      }
      return results
    }

    const lines = await enumerate(boolId, 'lineIndex')
    const arcs = await enumerate(boolId, 'arcIndex')
    const faces = await enumerate(boolId, 'faceIndex')
    const points = await enumerate(boolId, 'pointIndex')
    const nurbs = await enumerate(boolId, 'nurbsCurveIndex')

    console.log(`[16] bool result: lines=${lines.length}, arcs=${arcs.length}, faces=${faces.length}, points=${points.length}, nurbs=${nurbs.length}`)
    filewrite({ lines, arcs, faces, points, nurbs }, 'cyl-bool-brep')
    await snapshot('cyl-bool')
  }

  return { partId }
}
