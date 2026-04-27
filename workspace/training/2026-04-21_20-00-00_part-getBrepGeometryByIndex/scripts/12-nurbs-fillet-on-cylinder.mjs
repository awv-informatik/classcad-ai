export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, diameter: 60, height: 80 })).result
  await api.v1.common.recalc({})

  // Find a circular edge for filleting (top or bottom)
  const geoR = await api.v1.part.getGeometryIds({ id: partId, arcs: [{ pos: [30, 0, 0] }] })
  console.log(`[12] arcs found: ${JSON.stringify(geoR.result.arcs)}`)

  if (geoR.result.arcs && geoR.result.arcs.length > 0) {
    const arcId = geoR.result.arcs[0]
    console.log(`[12] filleting arc: ${arcId}`)

    const filletId = (await api.v1.part.fillet({ id: partId, name: 'CylFillet', references: [arcId], radius: 10 })).result
    console.log(`[12] filletId: ${filletId}`)
    await api.v1.common.recalc({})

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

    console.log(`[12] fillet-on-cylinder: lines=${lines.length}, arcs=${arcs.length}, faces=${faces.length}, points=${points.length}, nurbs=${nurbs.length}`)
    filewrite({ lines, arcs, faces, points, nurbs }, 'cyl-fillet-brep')
    await snapshot('cyl-fillet')
  } else {
    console.log('[12] no arcs found to fillet')
  }

  return { partId }
}
