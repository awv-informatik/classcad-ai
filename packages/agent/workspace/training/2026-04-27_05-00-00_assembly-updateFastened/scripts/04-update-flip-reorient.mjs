export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS1', origin: [30, 20, 20],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box2', length: 30, width: 15, height: 50 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS2', origin: [15, 7, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'Block' })).result

  // Create with default flip/reorient
  const cId = (await api.v1.assembly.fastened({
    id: asmId, name: 'F1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffset: 20,
  })).result

  const g0 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[04] initial flip/reorient:', JSON.stringify({ m1flip: g0.mate1.flip, m1reor: g0.mate1.reorient, m2flip: g0.mate2.flip, m2reor: g0.mate2.reorient }))
  filewrite(g0, 'initial-state')

  await snapshot('initial')

  // Update mate1 flip to -Z
  const r1 = await api.v1.assembly.updateFastened({ id: cId, mate1: { flip: '-Z' } })
  console.log('[04] update mate1 flip -Z:', r1.result, 'maxLevel:', r1.maxLevel)
  const g1 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[04] after mate1 flip -Z:', JSON.stringify({ m1flip: g1.mate1.flip, m1reor: g1.mate1.reorient }))
  filewrite(g1, 'after-flip-negZ')
  await snapshot('after-flip-negZ')

  // Update mate2 flip to X + reorient to 90
  const r2 = await api.v1.assembly.updateFastened({ id: cId, mate2: { flip: 'X', reorient: '90' } })
  console.log('[04] update mate2 flip X reorient 90:', r2.result, 'maxLevel:', r2.maxLevel)
  const g2 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[04] after mate2 update:', JSON.stringify({ m2flip: g2.mate2.flip, m2reor: g2.mate2.reorient }))
  filewrite(g2, 'after-mate2-flip-reorient')
  await snapshot('after-mate2-flip-reorient')

  // Update mate1 reorient to 180
  const r3 = await api.v1.assembly.updateFastened({ id: cId, mate1: { reorient: '180' } })
  console.log('[04] update mate1 reorient 180:', r3.result, 'maxLevel:', r3.maxLevel)
  const g3 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[04] after mate1 reorient:', JSON.stringify({ m1flip: g3.mate1.flip, m1reor: g3.mate1.reorient }))
  filewrite(g3, 'after-mate1-reorient')

  return { cId }
}
