export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Template A: base 60x40x10, csys at RIGHT-CENTER-TOP edge (60,20,10)
  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'BoxA', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'HingeA', origin: [60, 20, 10], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  // Template B: arm 80x20x8, csys at LEFT-CENTER-BOTTOM edge (0,10,0)
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'BoxB', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'HingeB', origin: [0, 10, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[120, 60, 40], [1, 0, 0], [0, 1, 0]],
  })).result

  // Ground inst1 at origin
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  const mass1before = (await api.v1.part.calculateMassProperties({ id: inst1 })).result
  const mass2before = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[05] inst1 COG before:', JSON.stringify(mass1before?.cog))
  console.log('[05] inst2 COG before:', JSON.stringify(mass2before?.cog))

  await snapshot('before')

  // Create revolute — does csys position matter?
  const r = await api.v1.assembly.revolute({
    id: asmId, name: 'Hinge1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })
  console.log('[05] revolute result:', r.result, 'maxLevel:', r.maxLevel)

  const mass1after = (await api.v1.part.calculateMassProperties({ id: inst1 })).result
  const mass2after = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[05] inst1 COG after:', JSON.stringify(mass1after?.cog))
  console.log('[05] inst2 COG after:', JSON.stringify(mass2after?.cog))

  // If csys position IGNORED (like fastened): inst2 at origin → COG (40,10,4)
  // If csys position USED: inst2 origin at (60-0, 20-10, 10-0)=(60,10,10) → COG (100,20,14)
  const inst2Origin = {
    x: mass2after.cog.x - 40,  // 40 = local arm COG x
    y: mass2after.cog.y - 10,  // 10 = local arm COG y
    z: mass2after.cog.z - 4,   // 4  = local arm COG z
  }
  console.log('[05] inst2 world origin:', JSON.stringify(inst2Origin))
  console.log('[05] Expected if csys ignored: (0,0,0)')
  console.log('[05] Expected if csys used:    (60,10,10)')

  await snapshot('after')
  await snapshot('after-top', { view: 'top' })

  filewrite({
    before: { inst1: mass1before, inst2: mass2before },
    after: { inst1: mass1after, inst2: mass2after },
    derivedOrigin: inst2Origin,
  }, 'csys-position-data')

  return { asmId, inst1, inst2 }
}
