// Test: where is the scale center?
// Create a box at origin and an offset box, scale both by 2x
// If scale is from origin, the offset box should move further away
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleCenterTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Box at origin: 30x30x30
  const box1 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30 })).result
  // Box offset to [60, 0, 0]: 30x30x30
  const box2 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30, translation: [60, 0, 0] })).result
  // Reference sphere far away
  const refId = (await api.v1.solid.sphere({ id: eifId, radius: 8, translation: [0, 100, 0] })).result

  await snapshot('before-center-test')

  // Scale box2 (offset) by factor 2
  // If scale is from origin: box2 should now span [120, 0, 0] to [180, 60, 60]
  // If scale is from body center: box2 should span [45, -15, -15] to [105, 45, 45]
  const r = await api.v1.solid.scale({ id: eifId, target: box2, factor: 2 })
  console.log('[07] scale offset box result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'scale-center-response')
  filewrite(r.graphic, 'graphic-after-scale')

  await snapshot('after-scale-offset-box')

  return { partId, eifId, box1, box2 }
}
