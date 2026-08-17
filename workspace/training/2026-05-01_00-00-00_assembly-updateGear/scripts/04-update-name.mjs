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

  const gearId = (await api.v1.assembly.gear({ id: asmId, name: 'OriginalName', constr1Id: rev1, constr2Id: rev2, ratio: 1.5, offset: '60deg' })).result
  console.log('[04] gear created:', gearId, 'name=OriginalName')

  // Rename via updateGear
  const upd = await api.v1.assembly.updateGear({ id: gearId, name: 'RenamedGear' })
  console.log('[04] rename result:', upd.result, 'maxLevel:', upd.maxLevel)

  // Old name should not find it
  const oldLookup = await api.v1.assembly.getGear({ id: asmId, name: 'OriginalName' })
  console.log('[04] old name lookup result:', oldLookup.result, 'maxLevel:', oldLookup.maxLevel)

  // New name should find it
  const newLookup = await api.v1.assembly.getGear({ id: asmId, name: 'RenamedGear' })
  console.log('[04] new name lookup result:', JSON.stringify(newLookup.result))
  console.log('[04] ratio preserved:', newLookup.result?.ratio, '(expected 1.5)')
  console.log('[04] offset preserved:', newLookup.result?.offset, '(expected ~1.0472)')

  filewrite({ oldLookup: { result: oldLookup.result, maxLevel: oldLookup.maxLevel }, newLookup: { result: newLookup.result, maxLevel: newLookup.maxLevel } }, 'rename-results')

  return { gearId }
}
