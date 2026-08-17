// Test update3DConstraintValue on slider (DOF: Z_OFFSET) and planar (DOFs: X_OFFSET, Y_OFFSET, Z_ROTATION)
export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'B', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Slide' })).result
  await api.v1.part.box({ id: tplB, name: 'B', length: 20, width: 15, height: 30 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tplC = (await api.v1.assembly.partTemplate({ name: 'Flat' })).result
  await api.v1.part.box({ id: tplC, name: 'B', length: 30, width: 25, height: 5 })
  const wcsC = (await api.v1.part.workCSys({
    id: tplC, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Slider',
    transformation: [[0, 0, 15], [1, 0, 0], [0, 1, 0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tplC, ownerId: asmId, name: 'Planar',
    transformation: [[0, 50, 15], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create slider constraint (DOF: Z translation only)
  const sliderId = (await api.v1.assembly.slider({
    id: asmId, name: 'SlideJ',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })).result
  console.log('[05] slider ID:', sliderId)

  // Create planar constraint (DOFs: X, Y translation + Z rotation)
  const planarId = (await api.v1.assembly.planar({
    id: asmId, name: 'PlanarJ',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst3], csys: wcsC },
  })).result
  console.log('[05] planar ID:', planarId)

  // Initial COGs
  const mp2_0 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  const mp3_0 = (await api.v1.assembly.calculateMassProperties({ id: inst3 })).result
  console.log('[05] slider INITIAL COG:', mp2_0.cog)
  console.log('[05] planar INITIAL COG:', mp3_0.cog)

  // SLIDER: Z_OFFSET (should work — slider DOF)
  const s1 = await api.v1.assembly.update3DConstraintValue({ id: sliderId, name: 'Z_OFFSET', value: 40 })
  console.log('[05] slider Z_OFFSET:', s1.maxLevel, JSON.stringify(s1.messages))
  const mp2_1 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[05] slider AFTER Z_OFFSET COG:', mp2_1.cog)

  // SLIDER: X_OFFSET (should be no-op)
  const s2 = await api.v1.assembly.update3DConstraintValue({ id: sliderId, name: 'X_OFFSET', value: 30 })
  console.log('[05] slider X_OFFSET:', s2.maxLevel, JSON.stringify(s2.messages))
  const mp2_2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[05] slider AFTER X_OFFSET COG:', mp2_2.cog)

  // PLANAR: X_OFFSET (should work — planar DOF)
  const p1 = await api.v1.assembly.update3DConstraintValue({ id: planarId, name: 'X_OFFSET', value: 60 })
  console.log('[05] planar X_OFFSET:', p1.maxLevel, JSON.stringify(p1.messages))
  const mp3_1 = (await api.v1.assembly.calculateMassProperties({ id: inst3 })).result
  console.log('[05] planar AFTER X_OFFSET COG:', mp3_1.cog)

  // PLANAR: Y_OFFSET (should work — planar DOF)
  const p2 = await api.v1.assembly.update3DConstraintValue({ id: planarId, name: 'Y_OFFSET', value: 80 })
  console.log('[05] planar Y_OFFSET:', p2.maxLevel, JSON.stringify(p2.messages))
  const mp3_2 = (await api.v1.assembly.calculateMassProperties({ id: inst3 })).result
  console.log('[05] planar AFTER Y_OFFSET COG:', mp3_2.cog)

  // PLANAR: Z_ROTATION (should work — planar DOF)
  const p3 = await api.v1.assembly.update3DConstraintValue({ id: planarId, name: 'Z_ROTATION', value: '45deg' })
  console.log('[05] planar Z_ROTATION (45deg string):', p3.maxLevel, JSON.stringify(p3.messages))
  const mp3_3 = (await api.v1.assembly.calculateMassProperties({ id: inst3 })).result
  console.log('[05] planar AFTER Z_ROTATION COG:', mp3_3.cog)

  // PLANAR: Z_OFFSET (should be no-op — not a planar DOF)
  const p4 = await api.v1.assembly.update3DConstraintValue({ id: planarId, name: 'Z_OFFSET', value: 50 })
  console.log('[05] planar Z_OFFSET (non-DOF):', p4.maxLevel, JSON.stringify(p4.messages))

  filewrite({
    slider: { initial: mp2_0.cog, afterZOff: mp2_1.cog, afterXOff: mp2_2.cog },
    planar: { initial: mp3_0.cog, afterXOff: mp3_1.cog, afterYOff: mp3_2.cog, afterZRot: mp3_3.cog },
  }, 'cog-results')

  await snapshot('final')
  return { sliderId, planarId }
}
