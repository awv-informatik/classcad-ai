// Test mixing radius on some corners, chamfer on others
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'MixRC' })).result

  // Rectangle with radius on 2 corners and chamfer on 2 corners
  const r = await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0, c: 8 },       // chamfer bottom-left
      { xa: 80, ya: 0, r: 10 },     // radius bottom-right
      { xa: 80, ya: 50, c: 8 },     // chamfer top-right
      { xa: 0, ya: 50, r: 10 },     // radius top-left
    ],
    close: true,
  })

  console.log('[15] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'mix-rc-response')
  await snapshot('mix-radius-chamfer')
  return { partId }
}
