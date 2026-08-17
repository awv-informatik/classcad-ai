export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create revolute with NO limits
  const revId = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'Hinge',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })).result

  const results = {}

  // Case 1: Set min-only (no existing limits)
  const ur1 = await api.v1.assembly.updateRevolute({ id: revId, zRotationLimits: { min: '-90deg' } })
  console.log('[06] min-only (no existing):', ur1.result, 'maxLevel:', ur1.maxLevel)
  const s1 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge' })).result
  console.log('[06] limits after min-only:', JSON.stringify(s1.zRotationLimits))
  results.case1_minOnly = s1.zRotationLimits

  // Case 2: Set max-only (min already exists from case 1)
  const ur2 = await api.v1.assembly.updateRevolute({ id: revId, zRotationLimits: { max: '180deg' } })
  console.log('[06] max-only (min exists):', ur2.result, 'maxLevel:', ur2.maxLevel)
  const s2 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge' })).result
  console.log('[06] limits after max-only:', JSON.stringify(s2.zRotationLimits))
  results.case2_maxOnly = s2.zRotationLimits

  // Case 3: Update min alone (both exist) — max should be preserved
  const ur3 = await api.v1.assembly.updateRevolute({ id: revId, zRotationLimits: { min: '-45deg' } })
  console.log('[06] update min alone:', ur3.result, 'maxLevel:', ur3.maxLevel)
  const s3 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge' })).result
  console.log('[06] limits after min update:', JSON.stringify(s3.zRotationLimits))
  results.case3_updateMinAlone = s3.zRotationLimits

  // Case 4: Remove max only (min preserved)
  const ur4 = await api.v1.assembly.updateRevolute({ id: revId, zRotationLimits: { max: null } })
  console.log('[06] remove max only:', ur4.result, 'maxLevel:', ur4.maxLevel)
  const s4 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge' })).result
  console.log('[06] limits after max removed:', JSON.stringify(s4.zRotationLimits))
  results.case4_removeMaxOnly = s4.zRotationLimits

  // Case 5: Remove min only (max already null)
  const ur5 = await api.v1.assembly.updateRevolute({ id: revId, zRotationLimits: { min: null } })
  console.log('[06] remove min only:', ur5.result, 'maxLevel:', ur5.maxLevel)
  const s5 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge' })).result
  console.log('[06] limits after min removed:', JSON.stringify(s5.zRotationLimits))
  results.case5_removeMinOnly = s5.zRotationLimits

  // Case 6: Remove both at once
  await api.v1.assembly.updateRevolute({ id: revId, zRotationLimits: { min: '10deg', max: '20deg' } })
  const ur6 = await api.v1.assembly.updateRevolute({ id: revId, zRotationLimits: null })
  console.log('[06] remove both:', ur6.result, 'maxLevel:', ur6.maxLevel)
  const s6 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge' })).result
  console.log('[06] limits after both removed:', JSON.stringify(s6.zRotationLimits))
  results.case6_removeBoth = s6.zRotationLimits

  // Case 7: Empty object {} — should error
  const ur7 = await api.v1.assembly.updateRevolute({ id: revId, zRotationLimits: {} })
  console.log('[06] empty object {}:', ur7.result, 'maxLevel:', ur7.maxLevel)
  if (ur7.messages?.length) console.log('[06] messages:', ur7.messages.map(m => m.message).join('; '))
  results.case7_emptyObject = { result: ur7.result, maxLevel: ur7.maxLevel }

  filewrite(results, 'partial-limits-data')
  return { revId }
}
