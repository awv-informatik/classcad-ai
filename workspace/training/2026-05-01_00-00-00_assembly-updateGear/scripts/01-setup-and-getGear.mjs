export default async function (api, { snapshot, filewrite }) {
  // Create assembly with 3 part templates + revolute constraints + gear relation
  const asmId = (await api.v1.assembly.create({ name: 'GearTestAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Wheel1' })).result
  await api.v1.part.cylinder({ id: tpl1, name: 'Cyl', height: 10, diameter: 40 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Axis', origin: [0, 0, 5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Wheel2' })).result
  await api.v1.part.cylinder({ id: tpl2, name: 'Cyl', height: 10, diameter: 20 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Axis', origin: [0, 0, 5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Wheel3' })).result
  await api.v1.part.cylinder({ id: tpl3, name: 'Cyl', height: 10, diameter: 30 })
  const wcs3 = (await api.v1.part.workCSys({
    id: tpl3, name: 'Axis', origin: [0, 0, 5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'I2', transformation: [[30, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId, name: 'I3', transformation: [[-35, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })

  const rev1 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result

  const rev2 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev2',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst3], csys: wcs3 },
  })).result

  // Create gear relation with known params
  const gearId = (await api.v1.assembly.gear({
    id: asmId,
    name: 'TestGear',
    constr1Id: rev1,
    constr2Id: rev2,
    ratio: 2.5,
    offset: '45deg',
  })).result
  console.log('[01] gear created:', gearId)

  // getGear — retrieve by name using assembly ID
  const info = await api.v1.assembly.getGear({ id: asmId, name: 'TestGear' })
  console.log('[01] getGear result:', JSON.stringify(info.result))
  console.log('[01] getGear maxLevel:', info.maxLevel)
  filewrite(info, 'getGear-response')

  // Verify all returned fields
  const r = info.result
  console.log('[01] id match:', r.id === gearId)
  console.log('[01] name:', r.name)
  console.log('[01] constr1Id:', r.constr1Id, '(expected:', rev1, ')')
  console.log('[01] constr2Id:', r.constr2Id, '(expected:', rev2, ')')
  console.log('[01] ratio:', r.ratio)
  console.log('[01] offset (radians):', r.offset, '(expected ~0.7854)')

  await snapshot('initial-gear')

  return { asmId, rev1, rev2, gearId, wcs1, wcs2, wcs3, inst1, inst2, inst3, tpl1, tpl2, tpl3 }
}
