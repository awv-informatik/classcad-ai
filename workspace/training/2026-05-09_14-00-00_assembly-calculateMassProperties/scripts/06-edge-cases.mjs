export default async function (api, { filewrite }) {
  // Test 1: Empty assembly (no instances)
  const asmId = (await api.v1.assembly.create({})).result
  const rEmpty = await api.v1.assembly.calculateMassProperties({ id: asmId })
  console.log('[06] empty asm result:', JSON.stringify(rEmpty.result), 'maxLevel:', rEmpty.maxLevel)
  if (rEmpty.messages?.length) console.log('[06] empty asm messages:', JSON.stringify(rEmpty.messages))

  // Test 2: Assembly with template but no instances
  const tplId = (await api.v1.assembly.partTemplate({})).result
  await api.v1.part.box({ id: tplId, name: 'Box', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const rNoInst = await api.v1.assembly.calculateMassProperties({ id: asmId })
  console.log('[06] asm w/ template but no inst result:', JSON.stringify(rNoInst.result), 'maxLevel:', rNoInst.maxLevel)
  if (rNoInst.messages?.length) console.log('[06] no inst messages:', JSON.stringify(rNoInst.messages))

  // Test 3: Assembly with empty template (template has no geometry)
  const emptyTpl = (await api.v1.assembly.partTemplate({})).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const emptyInst = (await api.v1.assembly.instance({ productId: emptyTpl, ownerId: asmId, name: 'EmptyInst' })).result

  const rEmptyInst = await api.v1.assembly.calculateMassProperties({ id: emptyInst })
  console.log('[06] empty template inst result:', JSON.stringify(rEmptyInst.result), 'maxLevel:', rEmptyInst.maxLevel)
  if (rEmptyInst.messages?.length) console.log('[06] empty template inst msgs:', JSON.stringify(rEmptyInst.messages.slice(0, 2)))

  // Test 4: Direct solid ID within part template context
  await api.v1.assembly.setCurrentInstance({ id: emptyInst })
  // Need to test solid.box ID
  const eifId = (await api.v1.part.entityInjection({ id: emptyTpl, name: 'EIF' })).result
  const solidId = (await api.v1.solid.box({ id: eifId, length: 20, width: 20, height: 20 })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const rSolid = await api.v1.assembly.calculateMassProperties({ id: solidId })
  console.log('[06] solid ID result:', JSON.stringify(rSolid.result), 'maxLevel:', rSolid.maxLevel)
  if (rSolid.messages?.length) console.log('[06] solid ID messages:', JSON.stringify(rSolid.messages.slice(0, 2)))

  // Test 5: Invalid/nonexistent ID
  const rBad = await api.v1.assembly.calculateMassProperties({ id: 999999 })
  console.log('[06] bad ID result:', JSON.stringify(rBad.result), 'maxLevel:', rBad.maxLevel)
  if (rBad.messages?.length) console.log('[06] bad ID messages:', JSON.stringify(rBad.messages.slice(0, 2)))

  filewrite({
    emptyAsm: { result: rEmpty.result, maxLevel: rEmpty.maxLevel, messages: rEmpty.messages },
    noInstAsm: { result: rNoInst.result, maxLevel: rNoInst.maxLevel, messages: rNoInst.messages },
    emptyTemplateInst: { result: rEmptyInst.result, maxLevel: rEmptyInst.maxLevel, messages: rEmptyInst.messages },
    solidId: { result: rSolid.result, maxLevel: rSolid.maxLevel, messages: rSolid.messages },
    badId: { result: rBad.result, maxLevel: rBad.maxLevel, messages: rBad.messages },
  }, 'edge-cases')

  return { asmId }
}
