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

  const gearId = (await api.v1.assembly.gear({ id: asmId, name: 'G1', constr1Id: rev1, constr2Id: rev2, ratio: 2 })).result
  console.log('[11] gear created:', gearId)

  // Update gear, then delete underlying revolute — verify cascade
  await api.v1.assembly.updateGear({ id: gearId, ratio: 5, offset: '90deg' })
  const before = (await api.v1.assembly.getGear({ id: asmId, name: 'G1' })).result
  console.log('[11] gear after update:', JSON.stringify(before))

  // Delete revolute rev1 (constr1Id of the gear)
  const delResult = await api.v1.assembly.deleteConstraint({ ids: [rev1] })
  console.log('[11] delete rev1 — result:', delResult.result, 'maxLevel:', delResult.maxLevel)

  // Try getGear — should be cascade-deleted
  const afterDel = await api.v1.assembly.getGear({ id: asmId, name: 'G1' })
  console.log('[11] getGear after cascade — result:', afterDel.result, 'maxLevel:', afterDel.maxLevel)

  // Try updateGear on deleted gear
  const updDel = await api.v1.assembly.updateGear({ id: gearId, ratio: 10 })
  console.log('[11] updateGear on deleted — result:', updDel.result, 'maxLevel:', updDel.maxLevel)
  if (updDel.messages?.length) console.log('[11] error msg:', updDel.messages[0].message, 'code:', updDel.messages[0].code)

  filewrite({
    before,
    afterDel: { result: afterDel.result, maxLevel: afterDel.maxLevel },
    updDel: { result: updDel.result, messages: updDel.messages, maxLevel: updDel.maxLevel },
  }, 'cascade-delete')

  return { gearId }
}
