export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ContourRefs' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [-25, -15, 0], endPos: [25, 15, 0]
  })).result

  // Pass contour element IDs directly instead of region ID
  const r1 = await api.v1.part.twist({
    id: partId, name: 'ContourTwist', references: rectIds,
    twistAngle: Math.PI / 2, limit2: 80,
  })
  console.log('[13] contour refs:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'contour-response')
  await snapshot('contour-refs')

  return { partId }
}
