export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GearAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'W1' })).result
  await api.v1.part.cylinder({ id: tpl1, name: 'C', height: 10, diameter: 40 })
  const wcs1 = (await api.v1.part.workCSys({ id: tpl1, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'W2' })).result
  await api.v1.part.cylinder({ id: tpl2, name: 'C', height: 10, diameter: 20 })
  const wcs2 = (await api.v1.part.workCSys({ id: tpl2, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result

  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'W3' })).result
  await api.v1.part.cylinder({ id: tpl3, name: 'C', height: 10, diameter: 30 })
  const wcs3 = (await api.v1.part.workCSys({ id: tpl3, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'I2', transformation: [[30,0,0],[1,0,0],[0,1,0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId, name: 'I3', transformation: [[-35,0,0],[1,0,0],[0,1,0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })
  const rev1 = (await api.v1.assembly.revolute({ id: asmId, name: 'R1', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [inst2], csys: wcs2 } })).result
  const rev2 = (await api.v1.assembly.revolute({ id: asmId, name: 'R2', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [inst3], csys: wcs3 } })).result

  const gearId = (await api.v1.assembly.gear({ id: asmId, name: 'G1', constr1Id: rev1, constr2Id: rev2, ratio: 2, offset: 0 })).result
  console.log('[03] gear created, ratio=2, offset=0')

  // Test offset update with radians
  const upd1 = await api.v1.assembly.updateGear({ id: gearId, offset: 1.5708 })
  console.log('[03] update offset to 1.5708 (90deg) — result:', upd1.result, 'maxLevel:', upd1.maxLevel)
  const after1 = (await api.v1.assembly.getGear({ id: asmId, name: 'G1' })).result
  console.log('[03] offset after radian update:', after1.offset)

  // Test offset update with degree expression
  const upd2 = await api.v1.assembly.updateGear({ id: gearId, offset: '30deg' })
  console.log('[03] update offset to "30deg" — result:', upd2.result, 'maxLevel:', upd2.maxLevel)
  const after2 = (await api.v1.assembly.getGear({ id: asmId, name: 'G1' })).result
  console.log('[03] offset after deg update:', after2.offset, '(expected ~0.5236)')

  // Test offset update with 0
  const upd3 = await api.v1.assembly.updateGear({ id: gearId, offset: 0 })
  console.log('[03] update offset to 0 — result:', upd3.result, 'maxLevel:', upd3.maxLevel)
  const after3 = (await api.v1.assembly.getGear({ id: asmId, name: 'G1' })).result
  console.log('[03] offset after reset:', after3.offset)

  // Verify ratio preserved through all offset updates
  console.log('[03] ratio preserved:', after1.ratio, after2.ratio, after3.ratio, '(all should be 2)')

  filewrite({ after1, after2, after3 }, 'offset-updates')

  return { gearId }
}
