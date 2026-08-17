export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a box and subtract a sphere — the intersection edges should be NURBS
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  // Create a sphere that intersects the box
  const sphId = (await api.v1.part.sphere({ id: partId, radius: 30, translation: [40, 30, 40] })).result

  // Boolean subtraction
  const boolId = (await api.v1.part.boolean({
    id: partId,
    name: 'BoolSub',
    type: 'SUBTRACTION',
    target: boxId,
    tools: [sphId],
  })).result
  console.log(`[14] boolId: ${boolId}`)
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

    console.log(`[14] bool result: lines=${lines.length}, arcs=${arcs.length}, faces=${faces.length}, points=${points.length}, nurbs=${nurbs.length}`)
    filewrite({ lines, arcs, faces, points, nurbs }, 'bool-brep')
    await snapshot('bool-result')
  }

  return { partId }
}
