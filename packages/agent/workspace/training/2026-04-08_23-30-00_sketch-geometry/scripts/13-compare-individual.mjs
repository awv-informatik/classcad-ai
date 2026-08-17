// Compare sketch.geometry vs individual sketch.line/sketch.circle calls
// Do they produce the same IDs and structure?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeomTest' })).result

  // Method A: individual calls
  const skA = (await api.v1.sketch.create({ id: partId })).result
  const lineA = (await api.v1.sketch.line({ id: skA, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const circleA = (await api.v1.sketch.circle({ id: skA, centerPos: [25, 25, 0], radius: 15 })).result
  const geomA = await api.v1.sketch.getGeometry({ id: skA })
  console.log('[13a] individual - lineId:', lineA, 'circleId:', circleA)
  console.log('[13a] getGeometry:', JSON.stringify(geomA.result))

  // Method B: batch geometry call
  const skB = (await api.v1.sketch.create({ id: partId })).result
  const rB = await api.v1.sketch.geometry({
    id: skB,
    lines: [{ startPos: [0, 0, 0], endPos: [50, 0, 0] }],
    circles: [{ centerPos: [25, 25, 0], radius: 15 }],
  })
  const geomB = await api.v1.sketch.getGeometry({ id: skB })
  console.log('[13b] geometry() - result:', JSON.stringify(rB.result))
  console.log('[13b] getGeometry:', JSON.stringify(geomB.result))

  filewrite({
    individual: { lineId: lineA, circleId: circleA, geom: geomA.result },
    batch: { result: rB.result, geom: geomB.result },
  }, 'compare-individual-vs-batch')

  return { partId }
}
