export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Create two templates with geometry and work axes
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 80, width: 40, height: 20 })
  const wa1 = (await api.v1.part.workAxis({ id: tpl1, name: 'Axis1', origin: [40, 20, 20], direction: [0, 0, 1] })).result
  const wcs1 = (await api.v1.part.workCSys({ id: tpl1, name: 'WCS1', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box2', length: 60, width: 20, height: 10 })
  const wa2 = (await api.v1.part.workAxis({ id: tpl2, name: 'Axis2', origin: [0, 10, 5], direction: [0, 0, 1] })).result
  const wcs2 = (await api.v1.part.workCSys({ id: tpl2, name: 'WCS2', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create instances
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'Arm', transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  // Lock base at origin
  await api.v1.assembly.fastenedOrigin({ id: asmId, instance: inst1, name: 'FO1', mate1: { path: [inst1], csys: wcs1 } })

  // COG before
  const cogBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[06] COG before revolute:', cogBefore?.centerOfGravity)

  await snapshot('before-revolute')

  // Two-phase creation of revolute constraint
  const revId = (await api.v1.assembly.createUncommitedObject({
    id: asmId,
    type: 'CC_RevoluteConstraint',
    name: 'RevJoint',
  })).result
  console.log('[06] uncommitted revolute id:', revId)

  await api.v1.part.openFeature({ id: revId })
  const updateR = await api.v1.assembly.updateRevolute({
    id: revId,
    mate1: { path: [inst1], references: [wa1] },
    mate2: { path: [inst2], references: [wa2] },
  })
  console.log('[06] updateRevolute result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'update-revolute')

  await api.v1.part.closeFeature({ id: revId })

  // Verify the constraint exists
  const getR = await api.v1.assembly.getRevolute({ id: asmId, name: 'RevJoint' })
  console.log('[06] getRevolute id:', getR.result?.id, 'maxLevel:', getR.maxLevel)
  filewrite(getR.result, 'get-revolute')

  // COG after
  const cogAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[06] COG after revolute:', cogAfter?.centerOfGravity)
  filewrite({ before: cogBefore?.centerOfGravity, after: cogAfter?.centerOfGravity }, 'cog-comparison')

  await snapshot('after-revolute')

  return { revId }
}
