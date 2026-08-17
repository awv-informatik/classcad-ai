export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Part1' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({ id: tpl1, name: 'WCS1', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Inst1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Inst2', transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  // Test 1: Two-phase fastenedOrigin commit
  const foId = (await api.v1.assembly.createUncommitedObject({
    id: asmId,
    type: 'CC_FastenedOriginConstraint',
    name: 'FO_TwoPhase',
  })).result
  console.log('[09] uncommitted FO id:', foId)

  await api.v1.part.openFeature({ id: foId })
  const updateR = await api.v1.assembly.updateFastenedOrigin({
    id: foId,
    mate1: { path: [inst1], csys: wcs1 },
    xOffset: 10,
    zOffset: 5,
  })
  console.log('[09] updateFastenedOrigin result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'update-fo')

  await api.v1.part.closeFeature({ id: foId })

  // Verify
  const getR = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_TwoPhase' })
  console.log('[09] getFastenedOrigin id:', getR.result?.id, 'xOffset:', getR.result?.xOffset, 'zOffset:', getR.result?.zOffset)
  filewrite(getR.result, 'get-fo')

  // Test 2: Duplicate name — create another with the same name
  const dup = await api.v1.assembly.createUncommitedObject({
    id: asmId,
    type: 'CC_FastenedOriginConstraint',
    name: 'FO_TwoPhase',
  })
  console.log('[09] duplicate name result:', dup.result, 'maxLevel:', dup.maxLevel)
  filewrite({ result: dup.result, messages: dup.messages, maxLevel: dup.maxLevel }, 'duplicate-name')

  if (dup.result && dup.maxLevel < 51) {
    // Decline
    await api.v1.part.openFeature({ id: dup.result })
    await api.v1.part.closeFeature({ id: dup.result })
  }

  // Test 3: Commit with no update — does it keep with default values?
  const noUpdateId = (await api.v1.assembly.createUncommitedObject({
    id: asmId,
    type: 'CC_FastenedConstraint',
    name: 'NoUpdate',
  })).result
  console.log('[09] no-update id:', noUpdateId)

  await api.v1.part.openFeature({ id: noUpdateId })
  // Just close without updating — is it declined or committed with defaults?
  await api.v1.part.closeFeature({ id: noUpdateId })

  const getNoUpdate = await api.v1.assembly.getFastened({ id: asmId, name: 'NoUpdate' })
  console.log('[09] getFastened (no update) result:', getNoUpdate.result, 'maxLevel:', getNoUpdate.maxLevel)
  filewrite({ result: getNoUpdate.result, messages: getNoUpdate.messages, maxLevel: getNoUpdate.maxLevel }, 'no-update-query')

  await snapshot('after-all')
  return { foId }
}
