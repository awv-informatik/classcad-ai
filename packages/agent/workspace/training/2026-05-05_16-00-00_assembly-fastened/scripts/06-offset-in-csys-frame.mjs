export default async function (api, { snapshot, filewrite }) {
  // Test: are offsets applied in mate1's csys frame?
  // Setup: mate1 csys with X pointing along world Y (rotated 90° CCW around Z)
  // If xOffset is in csys frame: xOffset=50 should move inst2 along world Y
  // If xOffset is in world frame: xOffset=50 should move inst2 along world X
  const asmId = (await api.v1.assembly.create({})).result

  // Template A: box 40x30x20, csys rotated: local X = world Y
  const tplA = (await api.v1.assembly.partTemplate({ name: 'PlateA' })).result
  await api.v1.part.box({ id: tplA, name: 'BA', length: 40, width: 30, height: 20 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'MA',
    origin: [0, 0, 0], xDirection: [0, 1, 0], yDirection: [-1, 0, 0],
  })).result

  // Template B: box 40x30x20, csys default
  const tplB = (await api.v1.assembly.partTemplate({ name: 'PlateB' })).result
  await api.v1.part.box({ id: tplB, name: 'BB', length: 40, width: 30, height: 20 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'MB',
    origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Inst1',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Inst2',
    transformation: [[150, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Apply fastened with xOffset=50
  const r = await api.v1.assembly.fastened({
    id: asmId, name: 'F_OffsetFrame',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    xOffset: 50,
  })
  console.log('[06] fastened:', r.result, 'maxLevel:', r.maxLevel)

  await api.v1.common.recalc({})
  await snapshot('after')

  const mass = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[06] COG:', JSON.stringify(mass?.cog))
  // If offset in csys frame (X=world Y): inst2 at (0,50,0), COG = (20,65,10)
  //   combined = (20+20)/2=20, (15+65)/2=40, 10
  // If offset in world frame: inst2 at (50,0,0), COG = (70,15,10)
  //   combined = (20+70)/2=45, (15+15)/2=15, 10

  filewrite(mass, 'mass-offset-frame')

  // Also test: yOffset=30
  // Delete the constraint and re-create
  // Actually just create a separate test

  return { r: r.result }
}
