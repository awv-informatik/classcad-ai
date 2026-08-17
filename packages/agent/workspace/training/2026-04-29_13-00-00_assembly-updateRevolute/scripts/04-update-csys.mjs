export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'CsysUpdateAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, length: 80, width: 50, height: 10 })
  const wcs1a = (await api.v1.part.workCSys({
    id: tpl1, name: 'WcsA', origin: [10, 10, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const wcs1b = (await api.v1.part.workCSys({
    id: tpl1, name: 'WcsB', origin: [70, 40, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, length: 10, width: 20, height: 50 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Wcs', origin: [5, 10, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BaseInst' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'ArmInst' })).result

  // Anchor base
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Anchor',
    mate1: { path: [inst1], csys: wcs1a },
  })

  // Create revolute at WcsA
  const cId = (await api.v1.assembly.revolute({
    id: asmId, name: 'RevCsys',
    mate1: { path: [inst1], csys: wcs1a },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  console.log('[04] created at WcsA:', cId)

  const before = (await api.v1.assembly.getRevolute({ id: asmId, name: 'RevCsys' })).result
  console.log('[04] before csys:', before.mate1.csys, '(expected:', wcs1a, ')')
  await snapshot('before-csysA')

  // Update mate1 csys to WcsB (different location on same template)
  const r = await api.v1.assembly.updateRevolute({ id: cId, mate1: { csys: wcs1b } })
  console.log('[04] update csys:', r.result, 'maxLevel:', r.maxLevel)

  const after = (await api.v1.assembly.getRevolute({ id: asmId, name: 'RevCsys' })).result
  console.log('[04] after csys:', after.mate1.csys, '(expected:', wcs1b, ')')
  console.log('[04] path preserved:', JSON.stringify(after.mate1.path))
  filewrite({ before: before.mate1, after: after.mate1 }, 'csys-change')
  await snapshot('after-csysB')

  return { cId }
}
