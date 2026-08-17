// Test: create sketch, add geometry, verify sketch is working
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId, name: 'GeoSketch' })).result
  console.log('[14] sketchId:', skId)

  // Add a rectangle
  const rectR = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [80, 50, 0],
  })
  console.log('[14] rectangle result:', rectR.result, 'maxLevel:', rectR.maxLevel)

  // Add a circle
  const circR = await api.v1.sketch.circle({
    id: skId,
    center: [40, 25, 0],
    radius: 15,
  })
  console.log('[14] circle result:', circR.result, 'maxLevel:', circR.maxLevel)

  filewrite({
    rectangle: { result: rectR.result, maxLevel: rectR.maxLevel },
    circle: { result: circR.result, maxLevel: circR.maxLevel },
  }, 'geometry-response')

  await snapshot('sketch-with-geometry')

  return { partId, skId }
}
