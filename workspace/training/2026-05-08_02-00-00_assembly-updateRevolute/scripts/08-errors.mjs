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

  const revId = (await api.v1.assembly.revolute({
    id: asmId, name: 'Hinge',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 10,
  })).result

  const errors = []

  // Case 1: Assembly ID instead of constraint ID
  const e1 = await api.v1.assembly.updateRevolute({ id: asmId, zOffset: 5 })
  errors.push({ case: 'asmId instead of constraintId', result: e1.result, maxLevel: e1.maxLevel, msg: e1.messages?.map(m => m.message + ' (code:' + m.code + ')') })
  console.log('[08] case1 asmId:', e1.result, 'maxLevel:', e1.maxLevel, e1.messages?.[0]?.message)

  // Case 2: Nonexistent ID (99999)
  const e2 = await api.v1.assembly.updateRevolute({ id: 99999, zOffset: 5 })
  errors.push({ case: 'nonexistent ID', result: e2.result, maxLevel: e2.maxLevel, msg: e2.messages?.map(m => m.message + ' (code:' + m.code + ')') })
  console.log('[08] case2 nonexist:', e2.result, 'maxLevel:', e2.maxLevel, e2.messages?.[0]?.message)

  // Case 3: Invalid flip
  const e3 = await api.v1.assembly.updateRevolute({ id: revId, mate2: { flip: 'INVALID' } })
  errors.push({ case: 'invalid flip', result: e3.result, maxLevel: e3.maxLevel, msg: e3.messages?.map(m => m.message + ' (code:' + m.code + ')') })
  console.log('[08] case3 invalid flip:', e3.result, 'maxLevel:', e3.maxLevel, e3.messages?.[0]?.message)

  // Case 4: Invalid reorient
  const e4 = await api.v1.assembly.updateRevolute({ id: revId, mate2: { reorient: '45' } })
  errors.push({ case: 'invalid reorient', result: e4.result, maxLevel: e4.maxLevel, msg: e4.messages?.map(m => m.message + ' (code:' + m.code + ')') })
  console.log('[08] case4 invalid reorient:', e4.result, 'maxLevel:', e4.maxLevel, e4.messages?.[0]?.message)

  // Case 5: Missing id entirely
  const e5 = await api.v1.assembly.updateRevolute({ zOffset: 5 })
  errors.push({ case: 'missing id', result: e5.result, maxLevel: e5.maxLevel, msg: e5.messages?.map(m => m.message + ' (code:' + m.code + ')') })
  console.log('[08] case5 missing id:', e5.result, 'maxLevel:', e5.maxLevel, e5.messages?.[0]?.message)

  // Case 6: Invalid csys ID
  const e6 = await api.v1.assembly.updateRevolute({ id: revId, mate2: { csys: 99999 } })
  errors.push({ case: 'invalid csys', result: e6.result, maxLevel: e6.maxLevel, msg: e6.messages?.map(m => m.message + ' (code:' + m.code + ')') })
  console.log('[08] case6 invalid csys:', e6.result, 'maxLevel:', e6.maxLevel, e6.messages?.[0]?.message)

  // Verify constraint survived all errors — check state is unchanged
  const state = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge' })).result
  console.log('[08] state survived:', state?.name, 'zOffset:', state?.zOffset, 'flip:', state?.mate2?.flip)

  const cog = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result?.cog
  console.log('[08] inst2 COG after errors:', JSON.stringify(cog))

  filewrite({ errors, stateAfterErrors: state, cogAfterErrors: cog }, 'error-data')
  return { revId }
}
