// 12 — Verify rotation center: rotate a shape offset from origin and check coordinates
// This answers: is rotation around the origin or shape center?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CenterTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Test' })).result

  // Place a simple line at a known offset from origin
  // Line from (20, 0, 0) to (20, 10, 0)
  await api.v1.curve.line({ id: shapeId, startPos: [20, 0, 0], endPos: [20, 10, 0] })

  // Rotate 90° around Z: if around origin, (20,0) -> (0,20) and (20,10) -> (-10,20)
  // If around shape center ~(20,5), the line would stay near (20,5)
  const r = await api.v1.curve.rotateShape({ id: shapeId, rotation: [0, 0, Math.PI / 2] })
  console.log('[12] rotation result:', r.result, 'maxLevel:', r.maxLevel)

  // Dump structure to check where the line endpoints ended up
  filewrite(r.structure, 'structure-after-rotation')

  await snapshot('rotation-center-test')

  return { partId }
}
