export default async function (api, { snapshot, filewrite }) {
  // Same setup: base plate + arm, but simpler csys at origins for clean analysis
  const asmId = (await api.v1.assembly.create({})).result

  // Template A: box 60x40x10, csys at origin
  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'BoxA', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'CsysA', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  // Template B: box 80x20x8, csys at origin
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'BoxB', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'CsysB', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // inst1 at origin, inst2 offset at (100, 50, 0)
  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Base',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[100, 50, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Measure per-instance COG before
  const mass1before = (await api.v1.part.calculateMassProperties({ id: inst1 })).result
  const mass2before = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[02] inst1 COG before:', JSON.stringify(mass1before?.cog))
  console.log('[02] inst2 COG before:', JSON.stringify(mass2before?.cog))

  // Read instance transforms before
  const gi1before = (await api.v1.assembly.getInstance({ id: asmId, name: 'Base' })).result
  const gi2before = (await api.v1.assembly.getInstance({ id: asmId, name: 'Arm' })).result
  console.log('[02] inst2 transform before:', JSON.stringify(gi2before?.transformation))

  await snapshot('before')

  // Create revolute: both csys at origin, so axes should align at inst1's origin
  const r = await api.v1.assembly.revolute({
    id: asmId,
    name: 'Rev1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })
  console.log('[02] revolute result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[02] messages:', JSON.stringify(r.messages))

  await snapshot('after')

  // Measure per-instance COG after
  const mass1after = (await api.v1.part.calculateMassProperties({ id: inst1 })).result
  const mass2after = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[02] inst1 COG after:', JSON.stringify(mass1after?.cog))
  console.log('[02] inst2 COG after:', JSON.stringify(mass2after?.cog))

  // Read instance transforms after
  const gi2after = (await api.v1.assembly.getInstance({ id: asmId, name: 'Arm' })).result
  console.log('[02] inst2 transform after:', JSON.stringify(gi2after?.transformation))

  // Assembly-level COG
  const asmMass = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[02] assembly COG after:', JSON.stringify(asmMass?.cog))

  filewrite({
    before: { inst1: mass1before, inst2: mass2before, inst2Transform: gi2before?.transformation },
    after: { inst1: mass1after, inst2: mass2after, inst2Transform: gi2after?.transformation, assemblyCOG: asmMass },
  }, 'spatial-data')

  return { asmId, inst1, inst2, revoluteId: r.result }
}
