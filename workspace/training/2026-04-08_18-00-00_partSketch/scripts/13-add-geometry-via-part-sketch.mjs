// 13 — Create sketch via part.sketch, then add geometry to verify it's usable
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.part.sketch({ id: partId, name: 'GeomTest' })).result

  // Add a rectangle
  const rectR = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [80, 50, 0],
  })
  console.log('[13] rectangle result:', rectR.result, 'maxLevel:', rectR.maxLevel)

  // Add a circle (correct param: centerPos, not center)
  const circR = await api.v1.sketch.circle({
    id: skId,
    centerPos: [40, 25, 0],
    radius: 15,
  })
  console.log('[13] circle result:', circR.result, 'maxLevel:', circR.maxLevel)

  await snapshot('geometry-in-part-sketch')

  return { partId, skId, rectId: rectR.result, circId: circR.result }
}
