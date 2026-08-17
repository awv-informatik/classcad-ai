export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IsGlobalTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  // Create an asymmetric box to make orientation changes visible
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 20, height: 30 })).result
  const refId = (await api.v1.solid.box({ id: eifId, length: 10, width: 10, height: 10, translation: [-30, -30, 0] })).result

  // First: rotate the box 90° around Z using global coords
  await api.v1.common.transformObjectWithMatrix({
    id: boxId,
    matrix: [
      [0, -1, 0, 0],
      [1,  0, 0, 0],
      [0,  0, 1, 0],
      [0,  0, 0, 1],
    ],
    isGlobal: true,
  })

  await snapshot('after-global-rotation')

  // Save STEP after global rotation
  const step1 = await api.v1.common.save({ format: 'STP' })
  filewrite(step1.result.content, 'step-after-global')

  // Now apply a translation with isGlobal: FALSE (local coordinates)
  // In local coords, X is now in the direction of the rotated X axis
  // After 90° Z rotation, local X = global Y, local Y = global -X
  // So translating [50, 0, 0] in local should move in global Y direction
  const r = await api.v1.common.transformObjectWithMatrix({
    id: boxId,
    matrix: [
      [1, 0, 0, 50],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
    isGlobal: false,
  })

  console.log('[06] isGlobal=false result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'isglobal-false-response')

  await snapshot('after-local-translation')

  // Save STEP after local translation
  const step2 = await api.v1.common.save({ format: 'STP' })
  filewrite(step2.result.content, 'step-after-local')

  return { partId, eifId, boxId }
}
