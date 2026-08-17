export default async function (api, { snapshot, filewrite }) {
  // Setup assembly
  const asmId = (await api.v1.assembly.create({})).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({ id: tpl1, name: 'WCS1', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Pin' })).result
  await api.v1.part.cylinder({ id: tpl2, name: 'Cyl1', height: 30, diameter: 15 })
  const wcs2 = (await api.v1.part.workCSys({ id: tpl2, name: 'WCS2', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Inst1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'Inst2', transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, instance: inst1, name: 'FO1', mate1: { path: [inst1], csys: wcs1 } })

  // --- Test 1: COMMIT pattern ---
  console.log('[02] === COMMIT PATTERN ===')
  const commitId = (await api.v1.assembly.createUncommitedObject({
    id: asmId,
    type: 'CC_FastenedConstraint',
    name: 'CommitFastened',
  })).result
  console.log('[02] uncommitted id:', commitId)

  // Try openFeature on the uncommitted constraint
  const openR = await api.v1.part.openFeature({ id: commitId })
  console.log('[02] openFeature result:', openR.result, 'maxLevel:', openR.maxLevel)
  filewrite({ result: openR.result, messages: openR.messages, maxLevel: openR.maxLevel }, 'open-result')

  // Try to update it (fastened needs mate1/mate2)
  const updateR = await api.v1.assembly.updateFastened({
    id: commitId,
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })
  console.log('[02] updateFastened result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'update-result')

  const closeR = await api.v1.part.closeFeature({ id: commitId })
  console.log('[02] closeFeature result:', closeR.result, 'maxLevel:', closeR.maxLevel)
  filewrite({ result: closeR.result, messages: closeR.messages, maxLevel: closeR.maxLevel }, 'close-result')

  // Verify: query the fastened constraint
  const getR = await api.v1.assembly.getFastened({ id: asmId, name: 'CommitFastened' })
  console.log('[02] getFastened result id:', getR.result?.id, 'maxLevel:', getR.maxLevel)
  filewrite({ result: getR.result, messages: getR.messages, maxLevel: getR.maxLevel }, 'get-committed')

  await snapshot('after-commit')

  // --- Test 2: DECLINE pattern ---
  console.log('[02] === DECLINE PATTERN ===')
  const declineId = (await api.v1.assembly.createUncommitedObject({
    id: asmId,
    type: 'CC_FastenedConstraint',
    name: 'DeclineFastened',
  })).result
  console.log('[02] decline id:', declineId)

  // Open then close WITHOUT update = decline
  const openD = await api.v1.part.openFeature({ id: declineId })
  console.log('[02] decline openFeature:', openD.result, 'maxLevel:', openD.maxLevel)

  const closeD = await api.v1.part.closeFeature({ id: declineId })
  console.log('[02] decline closeFeature:', closeD.result, 'maxLevel:', closeD.maxLevel)
  filewrite({ result: closeD.result, messages: closeD.messages, maxLevel: closeD.maxLevel }, 'decline-close-result')

  // Verify: querying the declined constraint should fail
  const getDR = await api.v1.assembly.getFastened({ id: asmId, name: 'DeclineFastened' })
  console.log('[02] getFastened (declined) result:', getDR.result, 'maxLevel:', getDR.maxLevel)
  filewrite({ result: getDR.result, messages: getDR.messages, maxLevel: getDR.maxLevel }, 'get-declined')

  await snapshot('after-decline')

  return { commitId, declineId }
}
