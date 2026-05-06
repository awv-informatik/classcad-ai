export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'StructTest' })).result

  // Call with no params at all
  const tpl1R = await api.v1.assembly.partTemplate()
  console.log('[06] partTemplate() no args - result:', tpl1R.result, 'maxLevel:', tpl1R.maxLevel)

  // Call with empty object
  const tpl2R = await api.v1.assembly.partTemplate({})
  console.log('[06] partTemplate({}) - result:', tpl2R.result)

  // Call with explicit name
  const tpl3R = await api.v1.assembly.partTemplate({ name: 'NamedPart' })
  console.log('[06] partTemplate({name:"NamedPart"}) - result:', tpl3R.result)

  // Build a box in tpl3 so it has geometry
  await api.v1.part.box({ id: tpl3R.result, name: 'Box', length: 50, width: 30, height: 20 })

  // Dump the full structure tree to understand where templates sit
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const r = await api.v1.assembly.instance({ productId: tpl3R.result, ownerId: asmId })

  // The structure tree should show CC_PartContainer with templates inside
  filewrite(r.structure, 'full-structure')

  // Check node types — find CC_PartContainer
  const nodes = r.structure?.tree || r.structure
  console.log('[06] structure keys:', Object.keys(r.structure || {}))

  return { tpl1: tpl1R.result, tpl2: tpl2R.result, tpl3: tpl3R.result }
}
