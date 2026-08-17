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

  // Create a third revolute for swapping
  const tpl4 = (await api.v1.assembly.partTemplate({ name: 'W4' })).result
  await api.v1.part.cylinder({ id: tpl4, name: 'C', height: 10, diameter: 15 })
  const wcs4 = (await api.v1.part.workCSys({ id: tpl4, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst4 = (await api.v1.assembly.instance({ productId: tpl4, ownerId: asmId, name: 'I4', transformation: [[0,40,0],[1,0,0],[0,1,0]] })).result
  const rev3 = (await api.v1.assembly.revolute({ id: asmId, name: 'R3', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [inst4], csys: wcs4 } })).result

  const gearId = (await api.v1.assembly.gear({ id: asmId, name: 'G1', constr1Id: rev1, constr2Id: rev2, ratio: 2 })).result

  // Before
  const before = (await api.v1.assembly.getGear({ id: asmId, name: 'G1' })).result
  console.log('[05] before — constr1Id:', before.constr1Id, '(rev1:', rev1, '), constr2Id:', before.constr2Id, '(rev2:', rev2, ')')

  // Swap constr1Id and constr2Id
  const upd1 = await api.v1.assembly.updateGear({ id: gearId, constr1Id: rev2, constr2Id: rev1 })
  console.log('[05] swap result:', upd1.result, 'maxLevel:', upd1.maxLevel)
  const afterSwap = (await api.v1.assembly.getGear({ id: asmId, name: 'G1' })).result
  console.log('[05] after swap — constr1Id:', afterSwap.constr1Id, 'constr2Id:', afterSwap.constr2Id)

  // Change only constr2Id to a different revolute
  const upd2 = await api.v1.assembly.updateGear({ id: gearId, constr2Id: rev3 })
  console.log('[05] change constr2Id to rev3 — result:', upd2.result, 'maxLevel:', upd2.maxLevel)
  const afterRelink = (await api.v1.assembly.getGear({ id: asmId, name: 'G1' })).result
  console.log('[05] after relink — constr1Id:', afterRelink.constr1Id, '(should be rev2:', rev2, '), constr2Id:', afterRelink.constr2Id, '(should be rev3:', rev3, ')')

  filewrite({ before, afterSwap, afterRelink, rev1, rev2, rev3 }, 'swap-results')

  return { gearId }
}
