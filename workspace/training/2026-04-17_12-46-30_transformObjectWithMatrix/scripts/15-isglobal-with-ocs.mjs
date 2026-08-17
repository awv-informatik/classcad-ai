export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IsGlobalOCSTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 20, height: 30 })).result
  const refId = (await api.v1.solid.box({ id: eifId, length: 10, width: 10, height: 10, translation: [-40, -40, 0] })).result

  // Set the box's OCS to a 90° rotated coordinate system
  await api.v1.common.setObjectCoordSystem({
    id: boxId,
    origin: [0, 0, 0],
    xVec: [0, 1, 0],   // local X points in global Y
    yVec: [-1, 0, 0],  // local Y points in global -X
  })

  // Save STEP after OCS change to verify position
  const step1 = await api.v1.common.save({ format: 'STP' })
  filewrite(step1.result.content, 'step-after-ocs')

  await snapshot('after-ocs')

  // Now translate [50, 0, 0] with isGlobal=TRUE — should move in global X
  const r1 = await api.v1.common.transformObjectWithMatrix({
    id: boxId,
    matrix: [
      [1, 0, 0, 50],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
    isGlobal: true,
  })
  console.log('[15] global translate - maxLevel:', r1.maxLevel)

  const step2 = await api.v1.common.save({ format: 'STP' })
  filewrite(step2.result.content, 'step-after-global-translate')

  await snapshot('after-global-translate')

  // Reset: undo the global translate by applying inverse
  await api.v1.common.transformObjectWithMatrix({
    id: boxId,
    matrix: [
      [1, 0, 0, -50],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
    isGlobal: true,
  })

  // Now translate [50, 0, 0] with isGlobal=FALSE — should move in LOCAL X (= global Y)
  const r2 = await api.v1.common.transformObjectWithMatrix({
    id: boxId,
    matrix: [
      [1, 0, 0, 50],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
    isGlobal: false,
  })
  console.log('[15] local translate - maxLevel:', r2.maxLevel)

  const step3 = await api.v1.common.save({ format: 'STP' })
  filewrite(step3.result.content, 'step-after-local-translate')

  await snapshot('after-local-translate')

  return { partId }
}
