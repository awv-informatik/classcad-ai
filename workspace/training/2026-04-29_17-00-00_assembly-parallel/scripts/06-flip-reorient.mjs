export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ParFlip' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 100, width: 80, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ref1', origin: [50, 40, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Mover' })).result
  await api.v1.part.box({ id: tpl2, name: 'Block', length: 30, width: 30, height: 20 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ref2', origin: [15, 15, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BaseInst' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'MoverInst' })).result

  // Default flip is "Z" — test with "X" on mate1 and "-Y" on mate2
  const r = await api.v1.assembly.parallel({
    id: asmId,
    name: 'ParFlip',
    mate1: { path: [inst1], csys: wcs1, flip: 'X' },
    mate2: { path: [inst2], csys: wcs2, flip: '-Y', reorient: '90' },
  })

  console.log('[06] flip/reorient result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'flip-response')

  const g = await api.v1.assembly.getParallel({ id: asmId, name: 'ParFlip' })
  console.log('[06] mate1.flip:', g.result.mate1.flip, 'mate2.flip:', g.result.mate2.flip, 'mate2.reorient:', g.result.mate2.reorient)
  filewrite(g.result, 'flip-get-result')

  await snapshot('flip-reorient')
  return { constraintId: r.result }
}
