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

  const gearId = (await api.v1.assembly.gear({ id: asmId, name: 'G1', constr1Id: rev1, constr2Id: rev2, ratio: 1, offset: 0 })).result

  // Update ALL optional params at once
  const upd = await api.v1.assembly.updateGear({
    id: gearId,
    name: 'AllUpdated',
    ratio: 5.5,
    offset: '120deg',
    constr1Id: rev2,
    constr2Id: rev1,
  })
  console.log('[09] multi-param update — result:', upd.result, 'maxLevel:', upd.maxLevel)

  const after = (await api.v1.assembly.getGear({ id: asmId, name: 'AllUpdated' })).result
  console.log('[09] after:', JSON.stringify(after))
  console.log('[09] name=AllUpdated:', after.name === 'AllUpdated')
  console.log('[09] ratio=5.5:', after.ratio === 5.5)
  console.log('[09] offset=120deg (~2.094):', after.offset)
  console.log('[09] constr1Id=rev2:', after.constr1Id === rev2)
  console.log('[09] constr2Id=rev1:', after.constr2Id === rev1)

  filewrite(after, 'multi-param-result')

  return { gearId }
}
