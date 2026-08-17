export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ErrorTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Part1' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box', length: 40, width: 30, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'Inst1',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'Inst2',
  })).result

  // Test 1: Missing mate2 entirely
  const r1 = await api.v1.assembly.fastened({
    id: asmId,
    name: 'F_NoMate2',
    mate1: { path: [inst1], csys: wcs1 },
  })
  console.log('[07] missing mate2:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'err-no-mate2')

  // Test 2: Invalid path (nonexistent instance ID)
  const r2 = await api.v1.assembly.fastened({
    id: asmId,
    name: 'F_BadPath',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [999999], csys: wcs1 },
  })
  console.log('[07] bad path:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'err-bad-path')

  // Test 3: Invalid csys (nonexistent ID)
  const r3 = await api.v1.assembly.fastened({
    id: asmId,
    name: 'F_BadCsys',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: 999999 },
  })
  console.log('[07] bad csys:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'err-bad-csys')

  // Test 4: Same instance in both mates (self-constraint)
  const r4 = await api.v1.assembly.fastened({
    id: asmId,
    name: 'F_Self',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst1], csys: wcs1 },
  })
  console.log('[07] self-constraint:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'err-self')

  // Test 5: Missing id (assembly ID)
  const r5 = await api.v1.assembly.fastened({
    name: 'F_NoId',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs1 },
  })
  console.log('[07] missing id:', r5.result, 'maxLevel:', r5.maxLevel)
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'err-no-id')

  // Test 6: Using template ID instead of instance ID in path
  const r6 = await api.v1.assembly.fastened({
    id: asmId,
    name: 'F_TplPath',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [tpl1], csys: wcs1 },
  })
  console.log('[07] template in path:', r6.result, 'maxLevel:', r6.maxLevel)
  filewrite({ result: r6.result, messages: r6.messages, maxLevel: r6.maxLevel }, 'err-tpl-path')

  return { asmId }
}
