export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 60, width: 40, height: 20 })
  const wcsA = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS_A', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const wcsB = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS_B', origin: [60, 40, 20],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  console.log('[05] wcsA:', wcsA, 'wcsB:', wcsB)

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box2', length: 20, width: 20, height: 30 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS2', origin: [10, 10, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'Block' })).result

  // Create with wcsA
  const cId = (await api.v1.assembly.fastened({
    id: asmId, name: 'F1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcs2 },
  })).result

  const g0 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[05] initial csys:', g0.mate1.csys)
  await snapshot('initial-wcsA')
  filewrite(g0, 'initial-wcsA')

  // Update mate1.csys to wcsB (different origin = different position)
  const r1 = await api.v1.assembly.updateFastened({ id: cId, mate1: { csys: wcsB } })
  console.log('[05] update csys result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'csys-update-response')

  const g1 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[05] after csys update:', g1.mate1.csys)
  await snapshot('after-wcsB')
  filewrite(g1, 'after-wcsB')

  return { cId }
}
