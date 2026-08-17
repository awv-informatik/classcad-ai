export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ErrorTest' })).result

  const tplId = (await api.v1.assembly.partTemplate({ name: 'ErrPart' })).result
  await api.v1.part.box({ id: tplId, name: 'Box', length: 30, width: 30, height: 30 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Test 1: Delete with invalid ID (999999)
  const r1 = await api.v1.assembly.deleteTemplate({ ids: [999999] })
  console.log('[04] invalid ID - result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[04] invalid ID - messages:', JSON.stringify(r1.messages))

  // Test 2: Delete the real template
  const r2 = await api.v1.assembly.deleteTemplate({ ids: [tplId] })
  console.log('[04] valid delete - result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Test 3: Double-delete (already deleted template)
  const r3 = await api.v1.assembly.deleteTemplate({ ids: [tplId] })
  console.log('[04] double-delete - result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[04] double-delete - messages:', JSON.stringify(r3.messages))

  // Test 4: Delete with non-template ID (assembly root)
  const r4 = await api.v1.assembly.deleteTemplate({ ids: [asmId] })
  console.log('[04] non-template ID - result:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[04] non-template ID - messages:', JSON.stringify(r4.messages))

  // Test 5: Delete with empty array
  const r5 = await api.v1.assembly.deleteTemplate({ ids: [] })
  console.log('[04] empty array - result:', r5.result, 'maxLevel:', r5.maxLevel)

  filewrite({
    invalidId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    validDelete: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    doubleDelete: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    nonTemplateId: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
    emptyArray: { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages },
  }, 'error-cases')

  return { asmId, tplId }
}
