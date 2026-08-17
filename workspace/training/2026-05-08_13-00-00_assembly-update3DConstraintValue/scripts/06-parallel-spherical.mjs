// Test update3DConstraintValue on parallel (DOFs: X_OFFSET, Y_OFFSET, Z_ROTATION) and spherical (DOFs: rotations)
export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'B', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Para' })).result
  await api.v1.part.box({ id: tplB, name: 'B', length: 25, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tplC = (await api.v1.assembly.partTemplate({ name: 'Ball' })).result
  await api.v1.part.sphere({ id: tplC, name: 'S', radius: 10 })
  const wcsC = (await api.v1.part.workCSys({
    id: tplC, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Para',
    transformation: [[0, 0, 15], [1, 0, 0], [0, 1, 0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tplC, ownerId: asmId, name: 'Ball',
    transformation: [[0, 50, 15], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Parallel constraint (DOFs: X_OFFSET, Y_OFFSET, Z_ROTATION — same as planar but keeps faces parallel)
  const parId = (await api.v1.assembly.parallel({
    id: asmId, name: 'ParJ',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })).result
  console.log('[06] parallel ID:', parId)

  // Spherical constraint (DOFs: X_ROTATION, Y_ROTATION — but update3DConstraintValue only has Z_ROTATION)
  const sphId = (await api.v1.assembly.spherical({
    id: asmId, name: 'SphJ',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst3], csys: wcsC },
  })).result
  console.log('[06] spherical ID:', sphId)

  // PARALLEL: test X_OFFSET, Y_OFFSET, Z_ROTATION
  const par0 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[06] parallel INITIAL COG:', par0.cog)

  const pr1 = await api.v1.assembly.update3DConstraintValue({ id: parId, name: 'X_OFFSET', value: 50 })
  console.log('[06] parallel X_OFFSET:', pr1.maxLevel, JSON.stringify(pr1.messages))
  const par1 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[06] parallel AFTER X_OFFSET COG:', par1.cog)

  const pr2 = await api.v1.assembly.update3DConstraintValue({ id: parId, name: 'Y_OFFSET', value: 30 })
  console.log('[06] parallel Y_OFFSET:', pr2.maxLevel)
  const par2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[06] parallel AFTER Y_OFFSET COG:', par2.cog)

  const pr3 = await api.v1.assembly.update3DConstraintValue({ id: parId, name: 'Z_ROTATION', value: '90deg' })
  console.log('[06] parallel Z_ROTATION:', pr3.maxLevel)
  const par3 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[06] parallel AFTER Z_ROTATION COG:', par3.cog)

  // SPHERICAL: test Z_ROTATION (not a listed DOF for spherical — spherical has x/y rotation)
  const sph0 = (await api.v1.assembly.calculateMassProperties({ id: inst3 })).result
  console.log('[06] spherical INITIAL COG:', sph0.cog)

  const sr1 = await api.v1.assembly.update3DConstraintValue({ id: sphId, name: 'Z_ROTATION', value: 1.0 })
  console.log('[06] spherical Z_ROTATION:', sr1.maxLevel, JSON.stringify(sr1.messages))
  const sph1 = (await api.v1.assembly.calculateMassProperties({ id: inst3 })).result
  console.log('[06] spherical AFTER Z_ROTATION COG:', sph1.cog)

  const sr2 = await api.v1.assembly.update3DConstraintValue({ id: sphId, name: 'X_OFFSET', value: 25 })
  console.log('[06] spherical X_OFFSET:', sr2.maxLevel, JSON.stringify(sr2.messages))

  filewrite({
    parallel: { initial: par0.cog, afterXOff: par1.cog, afterYOff: par2.cog, afterZRot: par3.cog },
    spherical: { initial: sph0.cog, afterZRot: sph1.cog },
  }, 'results')

  await snapshot('final')
  return { parId, sphId }
}
