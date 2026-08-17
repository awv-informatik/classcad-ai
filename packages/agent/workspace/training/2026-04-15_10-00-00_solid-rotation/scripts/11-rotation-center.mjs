// Test: where is the rotation center?
// Is it the origin, the body center, or something else?
// Create a box offset from origin and rotate — if center is origin,
// the box will orbit. If center is body center, it rotates in place.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CenterTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Place box far from origin
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 20, height: 15, translation: [80, 0, 0] })).result
  // Reference at origin
  const refId = (await api.v1.solid.sphere({ id: eifId, radius: 5 })).result

  await snapshot('before-offset-box')

  // Rotate 90° around Z — if center is origin, box should orbit to Y axis area
  const r = await api.v1.solid.rotation({ id: eifId, target: boxId, rotation: [0, 0, Math.PI / 2] })
  console.log('[11] rotation center test:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel }, 'center-test')

  await snapshot('after-90deg-z')
  return { boxId }
}
