export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'StringResolve' })).result

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Alpha'
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Beta',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  console.log('[09] inst1:', inst1, 'inst2:', inst2)

  // Set ident on inst1 only
  await api.v1.assembly.setIdent({ id: inst1, ident: 'ident_alpha' })

  // Test 1: transformInstance resolves name when no ident is set
  const tr_beta = await api.v1.assembly.transformInstance({
    id: 'Beta',
    transformation: [[1, 0, 0, 10], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
  })
  console.log('[09] transform by name "Beta":', tr_beta.maxLevel)
  filewrite({ result: tr_beta.result, messages: tr_beta.messages }, 'transform-by-name-Beta')

  // Test 2: transformInstance resolves ident when set
  const tr_alpha = await api.v1.assembly.transformInstance({
    id: 'ident_alpha',
    transformation: [[1, 0, 0, 20], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
  })
  console.log('[09] transform by ident "ident_alpha":', tr_alpha.maxLevel)

  // Test 3: can we still use name "Alpha" when ident is set?
  const tr_alpha_name = await api.v1.assembly.transformInstance({
    id: 'Alpha',
    transformation: [[1, 0, 0, 5], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
  })
  console.log('[09] transform by name "Alpha" (has ident):', tr_alpha_name.maxLevel)
  filewrite({ result: tr_alpha_name.result, messages: tr_alpha_name.messages }, 'transform-by-name-with-ident')

  // Test 4: conflict — set ident to same value as another instance's name
  await api.v1.assembly.setIdent({ id: inst2, ident: 'Alpha' })
  console.log('[09] set inst2 ident to "Alpha" (same as inst1 name)')

  // Now "Alpha" could resolve to inst1 (by name) or inst2 (by ident)
  // Which wins?
  const tr_conflict = await api.v1.assembly.transformInstance({
    id: 'Alpha',
    transformation: [[1, 0, 0, 100], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
  })
  console.log('[09] transform "Alpha" (conflict):', tr_conflict.maxLevel)

  // Verify who moved via COG
  const mp1 = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  const mp2 = await api.v1.assembly.calculateMassProperties({ id: inst2 })
  console.log('[09] inst1 COG:', JSON.stringify(mp1.result?.cog))
  console.log('[09] inst2 COG:', JSON.stringify(mp2.result?.cog))

  // Test 5: numeric string as ID — passing string "113" instead of number 113
  const tr_numstr = await api.v1.assembly.transformInstance({
    id: String(inst1),
    transformation: [[1, 0, 0, 1], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
  })
  console.log('[09] transform by numeric string "' + String(inst1) + '":', tr_numstr.maxLevel)

  // Final COGs
  const mp1f = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  const mp2f = await api.v1.assembly.calculateMassProperties({ id: inst2 })
  console.log('[09] final inst1 COG:', JSON.stringify(mp1f.result?.cog))
  console.log('[09] final inst2 COG:', JSON.stringify(mp2f.result?.cog))

  await snapshot('string-resolution')

  return { asmId }
}
