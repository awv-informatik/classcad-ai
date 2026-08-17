export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Block' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Error 1: same instance both mates
  const e1 = await api.v1.assembly.parallel({
    id: asmId, name: 'Err1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst1], csys: wcsA },
  })
  console.log('[08] same-instance:', e1.result, 'maxLevel:', e1.maxLevel)
  if (e1.messages?.length) console.log('[08] msg:', e1.messages[0]?.message, 'code:', e1.messages[0]?.code)

  // Error 2: invalid flip
  const e2 = await api.v1.assembly.parallel({
    id: asmId, name: 'Err2',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB, flip: 'W' },
  })
  console.log('[08] bad flip:', e2.result, 'maxLevel:', e2.maxLevel)
  if (e2.messages?.length) console.log('[08] msg:', e2.messages[0]?.message, 'code:', e2.messages[0]?.code)

  // Error 3: invalid reorient
  const e3 = await api.v1.assembly.parallel({
    id: asmId, name: 'Err3',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB, reorient: '45' },
  })
  console.log('[08] bad reorient:', e3.result, 'maxLevel:', e3.maxLevel)
  if (e3.messages?.length) console.log('[08] msg:', e3.messages[0]?.message, 'code:', e3.messages[0]?.code)

  // Error 4: missing mate2
  const e4 = await api.v1.assembly.parallel({
    id: asmId, name: 'Err4',
    mate1: { path: [inst1], csys: wcsA },
  })
  console.log('[08] missing mate2:', e4.result, 'maxLevel:', e4.maxLevel)
  if (e4.messages?.length) console.log('[08] msg:', e4.messages[0]?.message, 'code:', e4.messages[0]?.code)

  // Error 5: missing csys
  const e5 = await api.v1.assembly.parallel({
    id: asmId, name: 'Err5',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2] },
  })
  console.log('[08] missing csys:', e5.result, 'maxLevel:', e5.maxLevel)
  if (e5.messages?.length) console.log('[08] msg:', e5.messages[0]?.message, 'code:', e5.messages[0]?.code)

  filewrite({
    sameInstance: { result: e1.result, maxLevel: e1.maxLevel, msg: e1.messages?.[0] },
    badFlip: { result: e2.result, maxLevel: e2.maxLevel, msg: e2.messages?.[0] },
    badReorient: { result: e3.result, maxLevel: e3.maxLevel, msg: e3.messages?.[0] },
    missingMate2: { result: e4.result, maxLevel: e4.maxLevel, msg: e4.messages?.[0] },
    missingCsys: { result: e5.result, maxLevel: e5.maxLevel, msg: e5.messages?.[0] },
  }, 'errors')

  return { asmId }
}
