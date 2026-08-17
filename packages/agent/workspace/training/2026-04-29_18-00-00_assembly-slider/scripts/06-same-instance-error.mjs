export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ErrAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Part' })).result
  await api.v1.part.box({ id: tpl1, name: 'Body', length: 50, width: 30, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ax1', origin: [25, 15, 5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })

  // Same instance in both mates
  const r1 = await api.v1.assembly.slider({
    id: asmId, name: 'SelfSlide',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst1], csys: wcs1 },
  })
  console.log('[06] same instance result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[06] same instance messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'same-instance')

  // Missing mate2
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Part2' })).result
  await api.v1.part.box({ id: tpl2, name: 'Body2', length: 20, width: 20, height: 15 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ax2', origin: [10, 10, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result

  const r2 = await api.v1.assembly.slider({
    id: asmId, name: 'NoMate2',
    mate1: { path: [inst1], csys: wcs1 },
  })
  console.log('[06] missing mate2 result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[06] missing mate2 messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'missing-mate2')

  // Missing assembly id
  const r3 = await api.v1.assembly.slider({
    name: 'NoId',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })
  console.log('[06] missing id result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[06] missing id messages:', JSON.stringify(r3.messages))
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'missing-id')

  // Template ID in path (should fail)
  const r4 = await api.v1.assembly.slider({
    id: asmId, name: 'TplInPath',
    mate1: { path: [tpl1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })
  console.log('[06] template in path result:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[06] template in path messages:', JSON.stringify(r4.messages))
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'template-in-path')

  return { asmId }
}
