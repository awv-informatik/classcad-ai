export default async function (api, { snapshot, filewrite }) {
  // Create assembly with two part templates, each with a WCS
  const asmId = (await api.v1.assembly.create({ name: 'GearTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Wheel1' })).result
  await api.v1.part.cylinder({ id: tpl1, name: 'Cyl1', height: 10, diameter: 40 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Axis', origin: [0, 0, 5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Wheel2' })).result
  await api.v1.part.cylinder({ id: tpl2, name: 'Cyl2', height: 10, diameter: 20 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Axis', origin: [0, 0, 5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'W1',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'W2',
    transformation: [[30, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create two revolute constraints
  const rev1 = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO1',
    mate1: { path: [inst1], csys: wcs1 },
  })).result
  console.log('[01] fastenedOrigin rev1:', rev1)

  const rev2 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  console.log('[01] revolute rev2:', rev2)

  // Create a gear relation between the fastenedOrigin and revolute
  // Gear needs two constraints with rotation DOF — let's try two revolutes instead
  // Actually, gear links constr1Id and constr2Id — let me try with the revolute
  // The docs say constr1Id/constr2Id — these are constraint IDs

  // Let me create a second revolute on a third instance to have two revolute constraints
  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Wheel3' })).result
  await api.v1.part.cylinder({ id: tpl3, name: 'Cyl3', height: 10, diameter: 30 })
  const wcs3 = (await api.v1.part.workCSys({
    id: tpl3, name: 'Axis', origin: [0, 0, 5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst3 = (await api.v1.assembly.instance({
    productId: tpl3, ownerId: asmId, name: 'W3',
    transformation: [[-35, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const rev3 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev2',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst3], csys: wcs3 },
  })).result
  console.log('[01] revolute rev3:', rev3)

  // Now create gear relation between rev2 and rev3
  const gearR = await api.v1.assembly.gear({
    id: asmId,
    name: 'Gear1',
    constr1Id: rev2,
    constr2Id: rev3,
    ratio: 2,
  })
  console.log('[01] gear result:', gearR.result, 'maxLevel:', gearR.maxLevel)
  filewrite({ result: gearR.result, messages: gearR.messages, maxLevel: gearR.maxLevel }, 'gear-response')

  await snapshot('gear-basic')
  return { asmId, rev2, rev3, gearId: gearR.result }
}
