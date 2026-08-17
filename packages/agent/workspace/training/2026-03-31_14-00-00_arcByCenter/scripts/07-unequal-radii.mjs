// 07 — Non-equidistant start/end from center: start is 10 from center, end is 20 from center
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // startPos is 10 from center, endPos is 20 from center
  const r = await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [0, 0, 0],
    startPos: [10, 0, 0],
    endPos: [0, 20, 0],
  })
  console.log('[07] unequal radii:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[07] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'response')

  await snapshot('unequal-radii')
  return { partId, shapeId }
}
