export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ParErr' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 100, width: 80, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ref1', origin: [50, 40, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'OnlyInst' })).result

  // Error: same instance for both mates
  const r1 = await api.v1.assembly.parallel({
    id: asmId,
    name: 'SameInst',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst1], csys: wcs1 },
  })
  console.log('[10] same instance result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'same-instance')

  // Error: invalid assembly ID
  const r2 = await api.v1.assembly.parallel({
    id: 99999,
    name: 'BadId',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst1], csys: wcs1 },
  })
  console.log('[10] invalid id result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'invalid-id')

  // Error: missing mate2
  const r3 = await api.v1.assembly.parallel({
    id: asmId,
    name: 'NoMate2',
    mate1: { path: [inst1], csys: wcs1 },
  })
  console.log('[10] no mate2 result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'no-mate2')

  return {}
}
