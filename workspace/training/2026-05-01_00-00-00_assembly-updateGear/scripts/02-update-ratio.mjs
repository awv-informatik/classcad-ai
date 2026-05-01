export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GearAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'W1' })).result
  await api.v1.part.cylinder({ id: tpl1, name: 'C', height: 10, diameter: 40 })
  const wcs1 = (await api.v1.part.workCSys({ id: tpl1, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'W2' })).result
  await api.v1.part.cylinder({ id: tpl2, name: 'C', height: 10, diameter: 20 })
  const wcs2 = (await api.v1.part.workCSys({ id: tpl2, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'I2', transformation: [[30,0,0],[1,0,0],[0,1,0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })
  const rev1 = (await api.v1.assembly.revolute({ id: asmId, name: 'R1', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [inst2], csys: wcs2 } })).result

  // Need a second revolute — create third part
  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'W3' })).result
  await api.v1.part.cylinder({ id: tpl3, name: 'C', height: 10, diameter: 30 })
  const wcs3 = (await api.v1.part.workCSys({ id: tpl3, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId, name: 'I3', transformation: [[-35,0,0],[1,0,0],[0,1,0]] })).result
  const rev2 = (await api.v1.assembly.revolute({ id: asmId, name: 'R2', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [inst3], csys: wcs3 } })).result

  const gearId = (await api.v1.assembly.gear({ id: asmId, name: 'G1', constr1Id: rev1, constr2Id: rev2, ratio: 1, offset: 0 })).result
  console.log('[02] gear created:', gearId, 'ratio=1, offset=0')

  // Before update
  const before = (await api.v1.assembly.getGear({ id: asmId, name: 'G1' })).result
  console.log('[02] before:', JSON.stringify(before))

  // Update ratio only
  const upd = await api.v1.assembly.updateGear({ id: gearId, ratio: 3 })
  console.log('[02] updateGear result:', upd.result, 'maxLevel:', upd.maxLevel)

  // After update — verify ratio changed, offset preserved
  const after = (await api.v1.assembly.getGear({ id: asmId, name: 'G1' })).result
  console.log('[02] after:', JSON.stringify(after))
  console.log('[02] ratio changed:', before.ratio, '->', after.ratio)
  console.log('[02] offset preserved:', before.offset, '===', after.offset, '?', before.offset === after.offset)
  console.log('[02] name preserved:', before.name, '===', after.name, '?', before.name === after.name)
  console.log('[02] constr1Id preserved:', before.constr1Id, '===', after.constr1Id, '?', before.constr1Id === after.constr1Id)
  console.log('[02] constr2Id preserved:', before.constr2Id, '===', after.constr2Id, '?', before.constr2Id === after.constr2Id)

  filewrite({ before, after }, 'ratio-update-comparison')

  return { gearId }
}
