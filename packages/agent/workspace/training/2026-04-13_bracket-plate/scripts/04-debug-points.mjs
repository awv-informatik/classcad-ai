// Debug: figure out how to get point IDs from lines and circles
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create one line and one circle
  const line = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })
  const circle = await api.v1.sketch.circle({ id: skId, centerPos: [30, 30, 0], radius: 5 })
  console.log('[04] line:', line.result, 'circle:', circle.result)

  // getPoints on line
  const linePts = await api.v1.sketch.getPoints({ id: line.result })
  console.log('[04] line getPoints result:', JSON.stringify(linePts.result))
  console.log('[04] line getPoints maxLevel:', linePts.maxLevel)

  // getPoints on circle
  const circlePts = await api.v1.sketch.getPoints({ id: circle.result })
  console.log('[04] circle getPoints result:', JSON.stringify(circlePts.result))
  console.log('[04] circle getPoints maxLevel:', circlePts.maxLevel)

  // getPoints on sketch
  const skPts = await api.v1.sketch.getPoints({ id: skId })
  console.log('[04] sketch getPoints result:', JSON.stringify(skPts.result))

  // getGeometry on sketch
  const geom = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[04] sketch geometry:', JSON.stringify(geom.result))

  return { partId }
}
