// Test: pass structure tree node format as template entries
// Maybe the JSON format mirrors the structure tree
export default async function (api, { snapshot, filewrite }) {
  console.log('[12] Testing structure tree format as JSON templates...')

  // Build assembly, get structure, then try to use it as from() input
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'I1' })).result

  // Get the structure
  const res = await api.v1.common.recalc({})
  filewrite(res.structure, 'original-structure')

  // Extract the CC_Part node
  const partNode = res.structure.tree[String(tplId)]
  console.log('[12] Part node keys:', Object.keys(partNode))

  // Try the structure tree format as a template
  await api.v1.common.clear({})
  const attempts = [
    // Full structure tree node as template
    { label: 'full-node', tpl: partNode },
    // Just name + class + members
    { label: 'name-class-members', tpl: { name: partNode.name, class: partNode.class, members: partNode.members } },
    // Maybe need children too
    { label: 'with-children', tpl: { ...partNode } },
    // Maybe the JSON format is the WHOLE structure tree
    { label: 'whole-tree', data: JSON.stringify(res.structure) },
    // Maybe the format is { tree: {...}, root: id }
    { label: 'tree-root', data: JSON.stringify({ tree: res.structure.tree, root: res.structure.root }) },
  ]

  for (const att of attempts) {
    await api.v1.common.clear({})
    let r
    if (att.data) {
      // Pass the whole thing as data
      r = await api.v1.assembly.from({ data: att.data, format: 'JSON' })
    } else {
      const json = { templates: [att.tpl], instances: [], constraints: [] }
      r = await api.v1.assembly.from({ data: JSON.stringify(json), format: 'JSON' })
    }
    const status = r.maxLevel <= 31 ? '✓' : '❌'
    console.log(`[12] ${status} ${att.label}: result:${r.result} maxLevel:${r.maxLevel}`)
    if (r.messages?.length) {
      const firstMsg = r.messages[0].message.substring(0, 120)
      if (!firstMsg.includes('Uninitialized member')) {
        console.log(`[12]   DIFFERENT: ${firstMsg}`)
        filewrite({ label: att.label, result: r.result, messages: r.messages }, `diff-${att.label}`)
      }
    }
    if (r.maxLevel <= 31) {
      filewrite({ label: att.label, result: r.result, messages: r.messages }, `success-${att.label}`)
    }
  }

  // Try passing just templates as top-level (not wrapped)
  await api.v1.common.clear({})
  const r5 = await api.v1.assembly.from({
    data: JSON.stringify([partNode]),
    format: 'JSON',
  })
  console.log('[12] array-of-nodes:', r5.result, r5.maxLevel)
  if (r5.messages?.length) console.log('[12]  ', r5.messages[0].message.substring(0, 120))

  return {}
}
