export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 80, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({ id: tpl1, name: 'WCS1', origin: [40, 20, 20], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box2', length: 60, width: 20, height: 10 })
  const wcs2 = (await api.v1.part.workCSys({ id: tpl2, name: 'WCS2', origin: [0, 10, 5], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'Arm', transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, instance: inst1, name: 'FO1', mate1: { path: [inst1], csys: wcs1 } })

  await snapshot('before-revolute')

  // Two-phase revolute creation: createUncommitedObject → open → updateRevolute → close
  const revId = (await api.v1.assembly.createUncommitedObject({
    id: asmId,
    type: 'CC_RevoluteConstraint',
    name: 'RevJoint',
  })).result
  console.log('[07] uncommitted revolute id:', revId)

  await api.v1.part.openFeature({ id: revId })
  const updateR = await api.v1.assembly.updateRevolute({
    id: revId,
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })
  console.log('[07] updateRevolute result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'update-revolute')

  await api.v1.part.closeFeature({ id: revId })

  // Verify
  const getR = await api.v1.assembly.getRevolute({ id: asmId, name: 'RevJoint' })
  console.log('[07] getRevolute id:', getR.result?.id, 'name:', getR.result?.name)
  filewrite(getR.result, 'get-revolute')

  await snapshot('after-revolute')

  return { revId }
}
