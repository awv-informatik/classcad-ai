export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GearDelete' })).result

  const mkTemplate = async (name) => {
    const tpl = (await api.v1.assembly.partTemplate({ name })).result
    await api.v1.part.cylinder({ id: tpl, name: 'Cyl', height: 10, diameter: 20 })
    const wcs = (await api.v1.part.workCSys({
      id: tpl, name: 'Axis', origin: [0, 0, 5],
      xDirection: [1, 0, 0], yDirection: [0, 1, 0],
    })).result
    return { tpl, wcs }
  }

  const t1 = await mkTemplate('A')
  const t2 = await mkTemplate('B')
  const t3 = await mkTemplate('C')

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: t1.tpl, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: t2.tpl, ownerId: asmId, name: 'I2', transformation: [[25, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: t3.tpl, ownerId: asmId, name: 'I3', transformation: [[-25, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: t1.wcs } })
  const rev1 = (await api.v1.assembly.revolute({ id: asmId, name: 'Rev1', mate1: { path: [inst1], csys: t1.wcs }, mate2: { path: [inst2], csys: t2.wcs } })).result
  const rev2 = (await api.v1.assembly.revolute({ id: asmId, name: 'Rev2', mate1: { path: [inst1], csys: t1.wcs }, mate2: { path: [inst3], csys: t3.wcs } })).result

  const gearId = (await api.v1.assembly.gear({ id: asmId, name: 'GearToDel', constr1Id: rev1, constr2Id: rev2, ratio: 2 })).result
  console.log('[06] gear created:', gearId)

  // Verify it exists
  const before = await api.v1.assembly.getGear({ id: asmId, name: 'GearToDel' })
  console.log('[06] before delete:', before.result ? 'found' : 'not found')

  // Delete using deleteConstraint
  const delR = await api.v1.assembly.deleteConstraint({ ids: [gearId] })
  console.log('[06] deleteConstraint result:', delR.result, 'maxLevel:', delR.maxLevel)
  filewrite({ result: delR.result, messages: delR.messages, maxLevel: delR.maxLevel }, 'delete-result')

  // Verify it's gone
  const after = await api.v1.assembly.getGear({ id: asmId, name: 'GearToDel' })
  console.log('[06] after delete:', after.result, 'maxLevel:', after.maxLevel)

  // Test: what happens if we delete the underlying revolute constraint?
  const gearId2 = (await api.v1.assembly.gear({ id: asmId, name: 'GearWithDeletedRev', constr1Id: rev1, constr2Id: rev2, ratio: 1 })).result
  console.log('[06] gear2 created:', gearId2)

  // Delete rev1 (underlying revolute)
  const delRev = await api.v1.assembly.deleteConstraint({ ids: [rev1] })
  console.log('[06] deleted revolute rev1:', delRev.result, 'maxLevel:', delRev.maxLevel)

  // Check if gear still exists
  const afterRevDel = await api.v1.assembly.getGear({ id: asmId, name: 'GearWithDeletedRev' })
  console.log('[06] gear after rev delete:', afterRevDel.result, 'maxLevel:', afterRevDel.maxLevel)
  filewrite({ result: afterRevDel.result, messages: afterRevDel.messages, maxLevel: afterRevDel.maxLevel }, 'gear-after-rev-delete')

  return { gearId, deleteResult: delR.result }
}
