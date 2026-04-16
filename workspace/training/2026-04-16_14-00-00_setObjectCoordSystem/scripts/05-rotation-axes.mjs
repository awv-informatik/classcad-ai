// Test setObjectCoordSystem with rotated axes — does it reorient geometry?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CoordSysRotate' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  // Asymmetric box so rotation is visible
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 30, height: 20 })).result
  // Reference sphere that won't be affected
  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 10, translation: [0, -50, 0] })).result
  console.log('[05] partId:', partId, 'eifId:', eifId, 'boxId:', boxId, 'sphId:', sphId)

  // Dump graphic data before
  const gBefore = await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })
  filewrite(gBefore.graphic, 'graphic-before')

  await snapshot('before')

  // Set coord system on EIF with rotated axes — swap X and Y
  const r = await api.v1.common.setObjectCoordSystem({
    id: eifId,
    origin: [0, 0, 0],
    xVec: [0, 1, 0],
    yVec: [-1, 0, 0],
  })
  console.log('[05] setObjectCoordSystem rotated axes result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages.length > 0) console.log('[05] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rotated-response')

  await snapshot('after-rotated')

  return { partId, eifId, boxId, sphId }
}
