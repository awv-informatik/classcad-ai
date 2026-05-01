export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GearRatios' })).result

  // Create three templates with WCS
  const mkTemplate = async (name, diam) => {
    const tpl = (await api.v1.assembly.partTemplate({ name })).result
    await api.v1.part.cylinder({ id: tpl, name: 'Cyl', height: 10, diameter: diam })
    const wcs = (await api.v1.part.workCSys({
      id: tpl, name: 'Axis', origin: [0, 0, 5],
      xDirection: [1, 0, 0], yDirection: [0, 1, 0],
    })).result
    return { tpl, wcs }
  }

  const t1 = await mkTemplate('Base', 40)
  const t2 = await mkTemplate('Small', 20)
  const t3 = await mkTemplate('Medium', 30)

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: t1.tpl, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: t2.tpl, ownerId: asmId, name: 'I2', transformation: [[30, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: t3.tpl, ownerId: asmId, name: 'I3', transformation: [[-35, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  // Fix inst1, revolute for inst2 and inst3
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: t1.wcs } })
  const rev1 = (await api.v1.assembly.revolute({ id: asmId, name: 'Rev1', mate1: { path: [inst1], csys: t1.wcs }, mate2: { path: [inst2], csys: t2.wcs } })).result
  const rev2 = (await api.v1.assembly.revolute({ id: asmId, name: 'Rev2', mate1: { path: [inst1], csys: t1.wcs }, mate2: { path: [inst3], csys: t3.wcs } })).result

  // Test 1: ratio = 0.5
  const g1 = await api.v1.assembly.gear({ id: asmId, name: 'Gear_Half', constr1Id: rev1, constr2Id: rev2, ratio: 0.5 })
  console.log('[02] ratio=0.5:', g1.result, 'maxLevel:', g1.maxLevel)

  // Test 2: default ratio (should be 1)
  // Need another pair of revolutes for a second gear
  const t4 = await mkTemplate('Tiny', 15)
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst4 = (await api.v1.assembly.instance({ productId: t4.tpl, ownerId: asmId, name: 'I4', transformation: [[0, 35, 0], [1, 0, 0], [0, 1, 0]] })).result
  const rev3 = (await api.v1.assembly.revolute({ id: asmId, name: 'Rev3', mate1: { path: [inst1], csys: t1.wcs }, mate2: { path: [inst4], csys: t4.wcs } })).result

  // Need a 5th for the second constraint in this gear
  const t5 = await mkTemplate('Tiny2', 15)
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst5 = (await api.v1.assembly.instance({ productId: t5.tpl, ownerId: asmId, name: 'I5', transformation: [[0, -35, 0], [1, 0, 0], [0, 1, 0]] })).result
  const rev4 = (await api.v1.assembly.revolute({ id: asmId, name: 'Rev4', mate1: { path: [inst1], csys: t1.wcs }, mate2: { path: [inst5], csys: t5.wcs } })).result

  const g2 = await api.v1.assembly.gear({ id: asmId, name: 'Gear_Default', constr1Id: rev3, constr2Id: rev4 })
  console.log('[02] default ratio:', g2.result, 'maxLevel:', g2.maxLevel)

  // Test 3: offset with degree string
  const g3 = await api.v1.assembly.gear({ id: asmId, name: 'Gear_Offset', constr1Id: rev1, constr2Id: rev3, offset: '60deg' })
  console.log('[02] offset=60deg:', g3.result, 'maxLevel:', g3.maxLevel)

  // Test 4: offset with radians
  const g4 = await api.v1.assembly.gear({ id: asmId, name: 'Gear_OffsetRad', constr1Id: rev2, constr2Id: rev4, offset: 1.57 })
  console.log('[02] offset=1.57rad:', g4.result, 'maxLevel:', g4.maxLevel)

  filewrite({
    g1: { id: g1.result, messages: g1.messages, maxLevel: g1.maxLevel },
    g2: { id: g2.result, messages: g2.messages, maxLevel: g2.maxLevel },
    g3: { id: g3.result, messages: g3.messages, maxLevel: g3.maxLevel },
    g4: { id: g4.result, messages: g4.messages, maxLevel: g4.maxLevel },
  }, 'gear-variations')

  return { g1: g1.result, g2: g2.result, g3: g3.result, g4: g4.result }
}
