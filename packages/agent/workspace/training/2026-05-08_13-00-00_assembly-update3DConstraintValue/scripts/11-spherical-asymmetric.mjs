// Test update3DConstraintValue Z_ROTATION on spherical with asymmetric body
export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'B', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Asymmetric body — tall box, clearly not symmetric
  const tplB = (await api.v1.assembly.partTemplate({ name: 'LShape' })).result
  await api.v1.part.box({ id: tplB, name: 'B', length: 80, width: 15, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'LShape',
    transformation: [[0, 0, 15], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  const sphId = (await api.v1.assembly.spherical({
    id: asmId, name: 'SphJ',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })).result
  console.log('[11] spherical ID:', sphId)

  const mp0 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[11] INITIAL COG:', mp0.cog)

  await snapshot('before')

  // Z_ROTATION on spherical
  const r1 = await api.v1.assembly.update3DConstraintValue({ id: sphId, name: 'Z_ROTATION', value: '90deg' })
  console.log('[11] spherical Z_ROTATION:', r1.maxLevel, JSON.stringify(r1.messages))

  const mp1 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[11] AFTER Z_ROTATION COG:', mp1.cog)

  await snapshot('after-zrot')

  // X_OFFSET on spherical (should be no-op — spherical has no translational DOF)
  const r2 = await api.v1.assembly.update3DConstraintValue({ id: sphId, name: 'X_OFFSET', value: 50 })
  console.log('[11] spherical X_OFFSET:', r2.maxLevel)

  const mp2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[11] AFTER X_OFFSET COG:', mp2.cog)

  const cogChanged = JSON.stringify(mp0.cog) !== JSON.stringify(mp1.cog)
  console.log('[11] Z_ROTATION changed COG:', cogChanged)

  filewrite({
    initial: mp0.cog,
    afterZRot: mp1.cog,
    afterXOff: mp2.cog,
    zRotChanged: cogChanged,
  }, 'results')

  return { sphId }
}
