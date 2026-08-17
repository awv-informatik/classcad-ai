export default async function (api, { filewrite }) {
  // Test name edge cases: empty string, special chars

  // Test 1: empty name
  const asm1 = (await api.v1.assembly.create({ name: 'Root' })).result
  const r1 = await api.v1.assembly.convertToTemplate({ name: '' })
  const tpl1Name = r1.structure?.tree?.['12']?.name
  const tpl1OrigName = r1.structure?.tree?.['12']?.members?.originalName?.value
  console.log('[06] empty name → name:', tpl1Name, 'originalName:', tpl1OrigName)

  // Clean up for next test
  await api.v1.common.clear({})

  // Test 2: special characters
  const asm2 = (await api.v1.assembly.create({ name: 'Root' })).result
  const r2 = await api.v1.assembly.convertToTemplate({ name: 'My Sub/Asm (v2)' })
  const root2 = r2.structure?.root
  const tpl2Name = r2.structure?.tree?.['12']?.name
  const tpl2OrigName = r2.structure?.tree?.['12']?.members?.originalName?.value
  console.log('[06] special chars → name:', tpl2Name, 'originalName:', tpl2OrigName)

  await api.v1.common.clear({})

  // Test 3: no param at all (undefined)
  const asm3 = (await api.v1.assembly.create({ name: 'Root' })).result
  const r3 = await api.v1.assembly.convertToTemplate()
  const tpl3Name = r3.structure?.tree?.['12']?.name
  console.log('[06] no param → name:', tpl3Name)

  filewrite({
    emptyName: { name: tpl1Name, originalName: tpl1OrigName },
    specialChars: { name: tpl2Name, originalName: tpl2OrigName },
    noParam: { name: tpl3Name },
  }, 'name-edges')

  return {}
}
