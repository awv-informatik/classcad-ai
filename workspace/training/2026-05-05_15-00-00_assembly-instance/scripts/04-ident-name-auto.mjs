export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Test 1: auto-name (no name param)
  const r1 = await api.v1.assembly.instance({ productId: tplId, ownerId: asmId })
  console.log('[04] auto-name result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Test 2: auto-name again (should get different auto-generated name)
  const r2 = await api.v1.assembly.instance({ productId: tplId, ownerId: asmId,
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]] })
  console.log('[04] auto-name2 result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Test 3: with ident param
  const r3 = await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Custom',
    ident: 'PLATE-001',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[04] ident result:', r3.result, 'maxLevel:', r3.maxLevel)

  // Check structure to see auto-generated names and ident
  const structR = await api.v1.common.getAppVersion({})
  const tree = structR.structure.tree

  for (const id of [r1.result, r2.result, r3.result]) {
    const node = tree[String(id)]
    if (node) {
      console.log('[04] id:', id, 'name:', node.name, 'class:', node.class)
      if (node.members?.ident) console.log('  ident:', JSON.stringify(node.members.ident.value))
    }
  }
  filewrite(structR.structure, 'structure')

  // Test 4: duplicate name — does it error or succeed?
  const r4 = await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Custom',
    transformation: [[150, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[04] duplicate name result:', r4.result, 'maxLevel:', r4.maxLevel)
  if (r4.messages?.length) console.log('[04] dup name messages:', JSON.stringify(r4.messages))

  await snapshot('ident-names')
  return { auto1: r1.result, auto2: r2.result, ident: r3.result, dup: r4.result }
}
