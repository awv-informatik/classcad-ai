export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result

  // Test A: Same instance for both mates
  const rSame = await api.v1.assembly.planar({
    id: asmId,
    name: 'SameMate',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst1], csys: wcsA },
  })
  console.log('[09] same instance: result=', rSame.result, 'maxLevel:', rSame.maxLevel)
  if (rSame.messages?.length) console.log('[09] same instance msg:', rSame.messages[0].message, 'code:', rSame.messages[0].code)

  // Test B: Missing mate2
  const rNoMate2 = await api.v1.assembly.planar({
    id: asmId,
    name: 'NoMate2',
    mate1: { path: [inst1], csys: wcsA },
  })
  console.log('[09] no mate2: result=', rNoMate2.result, 'maxLevel:', rNoMate2.maxLevel)
  if (rNoMate2.messages?.length) console.log('[09] no mate2 msg:', rNoMate2.messages[0].message, 'code:', rNoMate2.messages[0].code)

  // Test C: Missing csys in mate
  const inst2 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Other' })).result
  const rNoCsys = await api.v1.assembly.planar({
    id: asmId,
    name: 'NoCsys',
    mate1: { path: [inst1] },
    mate2: { path: [inst2], csys: wcsA },
  })
  console.log('[09] no csys: result=', rNoCsys.result, 'maxLevel:', rNoCsys.maxLevel)
  if (rNoCsys.messages?.length) console.log('[09] no csys msg:', rNoCsys.messages[0].message, 'code:', rNoCsys.messages[0].code)

  // Test D: Invalid flip value
  const rBadFlip = await api.v1.assembly.planar({
    id: asmId,
    name: 'BadFlip',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsA, flip: 'W' },
  })
  console.log('[09] bad flip: result=', rBadFlip.result, 'maxLevel:', rBadFlip.maxLevel)
  if (rBadFlip.messages?.length) console.log('[09] bad flip msg:', rBadFlip.messages[0].message, 'code:', rBadFlip.messages[0].code)

  // Test E: Invalid reorient value
  const rBadReorient = await api.v1.assembly.planar({
    id: asmId,
    name: 'BadReorient',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsA, reorient: '45' },
  })
  console.log('[09] bad reorient: result=', rBadReorient.result, 'maxLevel:', rBadReorient.maxLevel)
  if (rBadReorient.messages?.length) console.log('[09] bad reorient msg:', rBadReorient.messages[0].message, 'code:', rBadReorient.messages[0].code)

  filewrite({
    sameInstance: { result: rSame.result, maxLevel: rSame.maxLevel, messages: rSame.messages },
    noMate2: { result: rNoMate2.result, maxLevel: rNoMate2.maxLevel, messages: rNoMate2.messages },
    noCsys: { result: rNoCsys.result, maxLevel: rNoCsys.maxLevel, messages: rNoCsys.messages },
    badFlip: { result: rBadFlip.result, maxLevel: rBadFlip.maxLevel, messages: rBadFlip.messages },
    badReorient: { result: rBadReorient.result, maxLevel: rBadReorient.maxLevel, messages: rBadReorient.messages },
  }, 'error-cases')

  return {}
}
