// Better non-orthogonal test — use rotated xVec so orthogonalization has visible effect
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NonOrthReveal' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  // Asymmetric box so rotation is visible
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 20, height: 20 })).result
  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 8, translation: [0, -30, 0] })).result
  console.log('[18] partId:', partId, 'eifId:', eifId, 'boxId:', boxId, 'sphId:', sphId)

  const step0 = (await api.v1.common.save({ format: 'STP', encoding: 'base64' })).result

  await snapshot('before')

  // xVec at 45 degrees in XY plane, yVec at 0 degrees — NOT perpendicular to xVec
  // If orthogonalized: yVec becomes [-sin45, cos45, 0] = [-0.707, 0.707, 0]
  // This should rotate geometry 45 degrees
  const r = await api.v1.common.setObjectCoordSystem({
    id: eifId,
    origin: [0, 0, 0],
    xVec: [1, 1, 0],   // 45 degrees
    yVec: [0, 1, 0],   // NOT perpendicular to xVec
  })
  console.log('[18] non-orthogonal revealing result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  const step1 = (await api.v1.common.save({ format: 'STP', encoding: 'base64' })).result
  console.log('[18] STEP files differ:', step0.content !== step1.content)
  filewrite(step0.content, 'step-before')
  filewrite(step1.content, 'step-after')

  await snapshot('after')

  return { partId, eifId, boxId, sphId }
}
