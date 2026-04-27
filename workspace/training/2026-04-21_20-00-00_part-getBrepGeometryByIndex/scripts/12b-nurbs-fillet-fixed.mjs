export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, diameter: 60, height: 80 })).result
  await api.v1.common.recalc({})

  // Use getBrepGeometryByIndex to get the arc IDs directly
  const arc0 = (await api.v1.part.getBrepGeometryByIndex({ id: cylId, arcIndex: 0 })).result
  const arc1 = (await api.v1.part.getBrepGeometryByIndex({ id: cylId, arcIndex: 1 })).result
  console.log(`[12b] cylinder arcs: ${arc0}, ${arc1}`)

  // Fillet the bottom arc
  const filletId = (await api.v1.part.fillet({ id: partId, name: 'CylFillet', references: [arc0], radius: 10 })).result
  console.log(`[12b] filletId: ${filletId}`)
  await api.v1.common.recalc({})

  if (filletId) {
    const enumerate = async (featureId, type, maxGuess = 10) => {
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

    const lines = await enumerate(filletId, 'lineIndex')
    const arcs = await enumerate(filletId, 'arcIndex')
    const faces = await enumerate(filletId, 'faceIndex')
    const points = await enumerate(filletId, 'pointIndex')
    const nurbs = await enumerate(filletId, 'nurbsCurveIndex')

    console.log(`[12b] fillet: lines=${lines.length}, arcs=${arcs.length}, faces=${faces.length}, points=${points.length}, nurbs=${nurbs.length}`)
    filewrite({ lines, arcs, faces, points, nurbs }, 'cyl-fillet-brep')
    await snapshot('cyl-fillet')
  } else {
    console.log('[12b] fillet creation failed')
  }

  return { partId }
}
