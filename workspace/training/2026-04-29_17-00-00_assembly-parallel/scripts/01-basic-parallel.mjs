export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ParallelAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 100, width: 80, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'ParRef1', origin: [50, 40, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Mover' })).result
  await api.v1.part.box({ id: tpl2, name: 'Block', length: 30, width: 30, height: 20 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'ParRef2', origin: [15, 15, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BaseInst' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'MoverInst' })).result

  const r = await api.v1.assembly.parallel({
    id: asmId,
    name: 'Par1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })

  console.log('[01] parallel result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'parallel-response')

  await snapshot('basic-parallel')
  return { asmId, inst1, inst2, constraintId: r.result, wcs1, wcs2 }
}
