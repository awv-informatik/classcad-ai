export default async function (api, { snapshot, filewrite }) {
  // Test: multiple moveUnderConstraints calls within one start/finish — do they accumulate or replace?
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'BaseBox', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'WcsA', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'ArmBox', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'WcsB', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'BaseInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'ArmInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA },
  })
  await api.v1.assembly.revolute({
    id: asmId, name: 'Hinge',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[07] COG before:', JSON.stringify(massBefore?.cog))
  await snapshot('before')

  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })

  // Move 1: 30° around Z
  // cos30≈0.866, sin30=0.5
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0.866, -0.5, 0], yDir: [0.5, 0.866, 0], zDir: [0, 0, 1] },
  })
  const mass1 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[07] COG after move1 (30°):', JSON.stringify(mass1?.cog))

  // Move 2: another 30° — does it add to 60° total, or replace to 30° from start?
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0.866, -0.5, 0], yDir: [0.5, 0.866, 0], zDir: [0, 0, 1] },
  })
  const mass2 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[07] COG after move2 (30° again):', JSON.stringify(mass2?.cog))

  // Move 3: 60° to compare
  // cos60=0.5, sin60≈0.866
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0.5, -0.866, 0], yDir: [0.866, 0.5, 0], zDir: [0, 0, 1] },
  })
  const mass3 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[07] COG after move3 (60°):', JSON.stringify(mass3?.cog))
  await snapshot('after-multi-move')

  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  // Compare: single start+60° move
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId,
    instanceIds: [inst2],
    pivotInfo: [0, 0, 0],
    mucType: 'ROTATION',
  })
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0.5, -0.866, 0], yDir: [0.866, 0.5, 0], zDir: [0, 0, 1] },
  })
  const massSingle = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[07] COG single 60° from current:', JSON.stringify(massSingle?.cog))
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  filewrite({ massBefore, mass1, mass2, mass3, massSingle }, 'multi-move-comparison')

  return { asmId }
}
