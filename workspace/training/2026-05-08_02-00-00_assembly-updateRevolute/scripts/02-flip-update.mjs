export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm', transformation: [[100, 50, 0], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create revolute with default flip (Z)
  const revId = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'Hinge',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })).result

  // Local COG of tplB: (40, 10, 4)
  const results = {}

  // Measure default (flip=Z)
  const cogZ = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  results.flipZ = cogZ?.cog
  console.log('[02] flip=Z (default) COG:', JSON.stringify(cogZ?.cog))

  // Update flip to -Z
  await api.v1.assembly.updateRevolute({ id: revId, mate2: { flip: '-Z' } })
  const cogMinusZ = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  results.flipMinusZ = cogMinusZ?.cog
  console.log('[02] flip=-Z COG:', JSON.stringify(cogMinusZ?.cog))

  await snapshot('flip-minusZ')

  // Update flip to X
  await api.v1.assembly.updateRevolute({ id: revId, mate2: { flip: 'X' } })
  const cogX = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  results.flipX = cogX?.cog
  console.log('[02] flip=X COG:', JSON.stringify(cogX?.cog))

  // Update flip to -X
  await api.v1.assembly.updateRevolute({ id: revId, mate2: { flip: '-X' } })
  const cogMinusX = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  results.flipMinusX = cogMinusX?.cog
  console.log('[02] flip=-X COG:', JSON.stringify(cogMinusX?.cog))

  // Update flip to Y
  await api.v1.assembly.updateRevolute({ id: revId, mate2: { flip: 'Y' } })
  const cogY = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  results.flipY = cogY?.cog
  console.log('[02] flip=Y COG:', JSON.stringify(cogY?.cog))

  // Update flip to -Y
  await api.v1.assembly.updateRevolute({ id: revId, mate2: { flip: '-Y' } })
  const cogMinusY = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  results.flipMinusY = cogMinusY?.cog
  console.log('[02] flip=-Y COG:', JSON.stringify(cogMinusY?.cog))

  // Verify state preserved (name should still be 'Hinge')
  const state = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge' })).result
  console.log('[02] final state flip:', state.mate2.flip, 'name:', state.name, 'zOffset:', state.zOffset)
  results.finalState = { mate2Flip: state.mate2.flip, name: state.name, zOffset: state.zOffset }

  filewrite(results, 'flip-data')
  return { revId }
}
