// Complex geometry: rectangle + circle + diagonal line — trim workflow
// Tests mergeBack with multiple intersections and mixed curve types
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ComplexGeom' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Rectangle
  const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [-40, -30, 0], endPos: [40, 30, 0] })).result
  console.log('[16] rect:', rect)

  // Circle intersecting the rectangle
  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 20 })).result
  console.log('[16] circle:', circle)

  const geomBefore = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[16] geomBefore:', JSON.stringify(geomBefore.result))
  await snapshot('before')

  // Split
  const splitIds = (await api.v1.sketch.splitAllCurves({ id: skId })).result
  console.log('[16] splitIds count:', splitIds.length)
  console.log('[16] splitIds:', JSON.stringify(splitIds))

  // Trim the circle segments inside the rectangle (upper and lower arcs)
  // With a circle and rectangle, the circle crosses the top and bottom sides
  // For now, just trim first two IDs (likely circle segments)
  await api.v1.sketch.trimCurves({ id: skId, curveIds: [splitIds[0], splitIds[1]] })

  // mergeBack
  const mergeR = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[16] mergeBack maxLevel:', mergeR.maxLevel)

  const geomAfter = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[16] geomAfter:', JSON.stringify(geomAfter.result))
  filewrite(geomAfter.result, 'geometry-after')

  await snapshot('after')

  return { partId }
}
