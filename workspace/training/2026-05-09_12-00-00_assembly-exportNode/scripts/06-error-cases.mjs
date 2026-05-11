export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  // Error: invalid ID
  const r1 = await api.v1.assembly.exportNode({ id: 99999 })
  console.log('[06] invalid ID — success:', r1.result?.success, 'maxLevel:', r1.maxLevel)
  console.log('[06] messages:', JSON.stringify(r1.messages))

  // Error: export with no assembly (after clear)
  await api.v1.common.clear({})
  const r2 = await api.v1.assembly.exportNode({ id: asmId })
  console.log('[06] after clear — success:', r2.result?.success, 'maxLevel:', r2.maxLevel)
  console.log('[06] messages:', JSON.stringify(r2.messages))

  // Try with no id param at all
  try {
    const r3 = await api.v1.assembly.exportNode({})
    console.log('[06] no id — success:', r3.result?.success, 'maxLevel:', r3.maxLevel)
    console.log('[06] messages:', JSON.stringify(r3.messages))
  } catch (e) {
    console.log('[06] no id — threw:', e.message)
  }

  // Try invalid format
  const asmId2 = (await api.v1.assembly.create({ name: 'TestAsm2' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.box({ id: tplId, name: 'B', length: 20, width: 20, height: 20 })

  const r4 = await api.v1.assembly.exportNode({ id: tplId, format: 'STL' })
  console.log('[06] invalid format STL — success:', r4.result?.success, 'maxLevel:', r4.maxLevel)
  console.log('[06] messages:', JSON.stringify(r4.messages))

  const r5 = await api.v1.assembly.exportNode({ id: tplId, format: 'IWP' })
  console.log('[06] invalid format IWP — success:', r5.result?.success, 'maxLevel:', r5.maxLevel)
  console.log('[06] messages:', JSON.stringify(r5.messages))

  filewrite({
    invalidId: { success: r1.result?.success, maxLevel: r1.maxLevel, messages: r1.messages },
    afterClear: { success: r2.result?.success, maxLevel: r2.maxLevel, messages: r2.messages },
    invalidFormatSTL: { success: r4.result?.success, maxLevel: r4.maxLevel, messages: r4.messages },
    invalidFormatIWP: { success: r5.result?.success, maxLevel: r5.maxLevel, messages: r5.messages },
  }, 'error-cases')

  return {}
}
