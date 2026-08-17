// Test update3DConstraintValue on fastenedOrigin constraint - all 4 names
export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'A' })).result

  // Create fastenedOrigin with xOffset=20
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO',
    mate1: { path: [inst], csys: wcs },
    xOffset: 20,
  })).result
  console.log('[02] fastenedOrigin ID:', foId)

  // Check initial state
  const mp0 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[02] INITIAL COG (asm):', mp0.cog)

  // Try X_OFFSET
  const r1 = await api.v1.assembly.update3DConstraintValue({
    id: foId, name: 'X_OFFSET', value: 80,
  })
  console.log('[02] X_OFFSET result:', r1.result, 'maxLevel:', r1.maxLevel, 'msgs:', JSON.stringify(r1.messages))

  const mp1 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[02] after X_OFFSET COG:', mp1.cog)

  // Try Y_OFFSET
  const r2 = await api.v1.assembly.update3DConstraintValue({
    id: foId, name: 'Y_OFFSET', value: 40,
  })
  console.log('[02] Y_OFFSET result:', r2.result, 'maxLevel:', r2.maxLevel, 'msgs:', JSON.stringify(r2.messages))

  // Try Z_OFFSET
  const r3 = await api.v1.assembly.update3DConstraintValue({
    id: foId, name: 'Z_OFFSET', value: 30,
  })
  console.log('[02] Z_OFFSET result:', r3.result, 'maxLevel:', r3.maxLevel, 'msgs:', JSON.stringify(r3.messages))

  // Try Z_ROTATION
  const r4 = await api.v1.assembly.update3DConstraintValue({
    id: foId, name: 'Z_ROTATION', value: 1.5708,
  })
  console.log('[02] Z_ROTATION result:', r4.result, 'maxLevel:', r4.maxLevel, 'msgs:', JSON.stringify(r4.messages))

  // Measure final
  const mpFinal = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[02] FINAL COG (asm):', mpFinal.cog)

  // Check getFastenedOrigin
  const state = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO' })).result
  console.log('[02] getFastenedOrigin:', JSON.stringify(state))
  filewrite(state, 'fo-state')

  filewrite({
    initial: mp0.cog,
    final: mpFinal.cog,
    r1: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    r2: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    r3: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    r4: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'all-results')

  await snapshot('final')
  return { foId }
}
