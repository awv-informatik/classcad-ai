export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Template A: base plate 60x40x10
  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'BoxA', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'CsysA', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  // Template B: arm 80x20x8
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'BoxB', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'CsysB', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Base',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[100, 50, 30], [1, 0, 0], [0, 1, 0]],
  })).result

  // Ground inst1 with fastenedOrigin
  const foR = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA },
  })
  console.log('[03] fastenedOrigin result:', foR.result, 'maxLevel:', foR.maxLevel)

  // Measure before revolute
  const mass1before = (await api.v1.part.calculateMassProperties({ id: inst1 })).result
  const mass2before = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[03] inst1 COG before revolute:', JSON.stringify(mass1before?.cog))
  console.log('[03] inst2 COG before revolute:', JSON.stringify(mass2before?.cog))

  await snapshot('before-revolute')

  // Create revolute constraint
  const r = await api.v1.assembly.revolute({
    id: asmId,
    name: 'Hinge1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })
  console.log('[03] revolute result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[03] messages:', JSON.stringify(r.messages))

  await snapshot('after-revolute')

  // Measure after revolute
  const mass1after = (await api.v1.part.calculateMassProperties({ id: inst1 })).result
  const mass2after = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[03] inst1 COG after revolute:', JSON.stringify(mass1after?.cog))
  console.log('[03] inst2 COG after revolute:', JSON.stringify(mass2after?.cog))

  // Check: did inst1 stay put?
  const dx1 = Math.abs(mass1before.cog.x - mass1after.cog.x)
  const dy1 = Math.abs(mass1before.cog.y - mass1after.cog.y)
  const dz1 = Math.abs(mass1before.cog.z - mass1after.cog.z)
  console.log('[03] inst1 moved? delta:', dx1.toFixed(3), dy1.toFixed(3), dz1.toFixed(3), (dx1 + dy1 + dz1 < 0.01 ? '✓ STAYED' : '❌ MOVED'))

  // Assembly COG
  const asmMass = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] assembly COG:', JSON.stringify(asmMass?.cog))

  // Read constraint state
  const getR = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge1' })).result
  console.log('[03] getRevolute:', JSON.stringify(getR))

  filewrite({
    before: { inst1: mass1before, inst2: mass2before },
    after: { inst1: mass1after, inst2: mass2after, assemblyCOG: asmMass },
    constraint: getR,
  }, 'grounded-data')

  return { asmId, inst1, inst2, wcsA, wcsB, revoluteId: r.result }
}
