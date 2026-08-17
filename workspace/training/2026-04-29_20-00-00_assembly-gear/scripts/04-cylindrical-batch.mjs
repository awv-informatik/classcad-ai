export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GearCylBatch' })).result

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
  const t4 = await mkTemplate('D')

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: t1.tpl, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: t2.tpl, ownerId: asmId, name: 'I2', transformation: [[25, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: t3.tpl, ownerId: asmId, name: 'I3', transformation: [[-25, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  const inst4 = (await api.v1.assembly.instance({ productId: t4.tpl, ownerId: asmId, name: 'I4', transformation: [[0, 25, 0], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: t1.wcs } })

  // Test 1: cylindrical constraints in gear
  const cyl1 = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'Cyl1',
    mate1: { path: [inst1], csys: t1.wcs },
    mate2: { path: [inst2], csys: t2.wcs },
  })).result
  const cyl2 = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'Cyl2',
    mate1: { path: [inst1], csys: t1.wcs },
    mate2: { path: [inst3], csys: t3.wcs },
  })).result

  const g1 = await api.v1.assembly.gear({ id: asmId, name: 'GearCyl', constr1Id: cyl1, constr2Id: cyl2 })
  console.log('[04] cylindrical gear:', g1.result, 'maxLevel:', g1.maxLevel)
  if (g1.messages?.length) console.log('[04] cylindrical messages:', JSON.stringify(g1.messages))

  // Test 2: batch creation with revolutes
  const rev1 = (await api.v1.assembly.revolute({ id: asmId, name: 'Rev1', mate1: { path: [inst1], csys: t1.wcs }, mate2: { path: [inst2], csys: t2.wcs } })).result
  const rev2 = (await api.v1.assembly.revolute({ id: asmId, name: 'Rev2', mate1: { path: [inst1], csys: t1.wcs }, mate2: { path: [inst3], csys: t3.wcs } })).result
  const rev3 = (await api.v1.assembly.revolute({ id: asmId, name: 'Rev3', mate1: { path: [inst1], csys: t1.wcs }, mate2: { path: [inst4], csys: t4.wcs } })).result

  const g2 = await api.v1.assembly.gear([
    { id: asmId, name: 'BatchGear1', constr1Id: rev1, constr2Id: rev2, ratio: 2 },
    { id: asmId, name: 'BatchGear2', constr1Id: rev2, constr2Id: rev3, ratio: 0.5, offset: '45deg' },
  ])
  console.log('[04] batch gear:', g2.result, 'maxLevel:', g2.maxLevel)

  filewrite({
    cylindricalGear: { result: g1.result, messages: g1.messages, maxLevel: g1.maxLevel },
    batchGear: { result: g2.result, messages: g2.messages, maxLevel: g2.maxLevel },
  }, 'cylindrical-batch')

  return { cyl1, cyl2, g1: g1.result, batchResult: g2.result }
}
