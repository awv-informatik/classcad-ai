// Test update3DConstraintValue array form (batch) and lowercase name
export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'B', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm1' })).result
  await api.v1.part.box({ id: tplB, name: 'B', length: 80, width: 15, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tplC = (await api.v1.assembly.partTemplate({ name: 'Arm2' })).result
  await api.v1.part.box({ id: tplC, name: 'B', length: 60, width: 12, height: 6 })
  const wcsC = (await api.v1.part.workCSys({
    id: tplC, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm1',
    transformation: [[0, 0, 15], [1, 0, 0], [0, 1, 0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tplC, ownerId: asmId, name: 'Arm2',
    transformation: [[0, 0, 30], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  const rev1 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 15,
  })).result

  const rev2 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev2',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst3], csys: wcsC },
    zOffset: 30,
  })).result
  console.log('[08] rev1:', rev1, 'rev2:', rev2)

  // Initial COGs
  const mp2_0 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  const mp3_0 = (await api.v1.assembly.calculateMassProperties({ id: inst3 })).result
  console.log('[08] arm1 INITIAL COG:', mp2_0.cog)
  console.log('[08] arm2 INITIAL COG:', mp3_0.cog)

  // Array form: update both revolutes in one call
  const r = await api.v1.assembly.update3DConstraintValue([
    { id: rev1, name: 'Z_ROTATION', value: '90deg' },
    { id: rev2, name: 'Z_ROTATION', value: '45deg' },
  ])
  console.log('[08] array result:', r.result, 'maxLevel:', r.maxLevel, 'msgs:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'array-response')

  // Check if both moved
  const mp2_1 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  const mp3_1 = (await api.v1.assembly.calculateMassProperties({ id: inst3 })).result
  console.log('[08] arm1 AFTER COG:', mp2_1.cog)
  console.log('[08] arm2 AFTER COG:', mp3_1.cog)

  await snapshot('after-array')

  // Test lowercase: does z_rotation on revolute actually change anything?
  const mp2_2pre = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[08] arm1 BEFORE lowercase COG:', mp2_2pre.cog)

  const r2 = await api.v1.assembly.update3DConstraintValue({
    id: rev1, name: 'z_rotation', value: 0,
  })
  console.log('[08] lowercase z_rotation result:', r2.result, 'maxLevel:', r2.maxLevel, 'msgs:', JSON.stringify(r2.messages))

  const mp2_2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[08] arm1 AFTER lowercase COG:', mp2_2.cog)

  // Compare: did lowercase have any effect?
  const lcChanged = JSON.stringify(mp2_2pre.cog) !== JSON.stringify(mp2_2.cog)
  console.log('[08] lowercase changed COG:', lcChanged)

  filewrite({
    initial: { arm1: mp2_0.cog, arm2: mp3_0.cog },
    afterArray: { arm1: mp2_1.cog, arm2: mp3_1.cog },
    lowercaseEffect: { before: mp2_2pre.cog, after: mp2_2.cog, changed: lcChanged },
  }, 'results')

  return { rev1, rev2 }
}
