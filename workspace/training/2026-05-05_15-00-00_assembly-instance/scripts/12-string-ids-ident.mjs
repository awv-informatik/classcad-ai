export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create using string productId (template name)
  const r1 = await api.v1.assembly.instance({
    productId: 'Bracket', ownerId: asmId, name: 'ByName1',
  })
  console.log('[12] string productId:', r1.result, 'maxLevel:', r1.maxLevel)

  // Create using string ownerId (assembly name doesn't really apply here, but test it)
  // The assembly root is typically named "AssemblyRoot" per structure tree
  const r2 = await api.v1.assembly.instance({
    productId: tplId, ownerId: 'AssemblyRoot', name: 'ByOwnerName',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[12] string ownerId:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[12] msgs:', JSON.stringify(r2.messages[0]))

  // Create with ident and check if getInstance can use ident
  const r3 = await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'WithIdent',
    ident: 'BRKT-042',
    transformation: [[120, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[12] with ident:', r3.result, 'maxLevel:', r3.maxLevel)

  // Can we find instance by ident via getInstance? (likely no, but test)
  const r4 = await api.v1.assembly.getInstance({ ownerId: asmId, name: 'BRKT-042' })
  console.log('[12] find by ident as name:', JSON.stringify(r4.result))

  // Try using ident as string identifier for productId in another instance call
  const r5 = await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'UseIdent',
    ident: 'BRKT-043',
    transformation: [[180, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[12] another ident:', r5.result, 'maxLevel:', r5.maxLevel)

  // Check getUserData to see if ident is stored there
  const udKeys = await api.v1.common.getUserDataKeys({ id: r3.result })
  console.log('[12] user data keys on instance with ident:', JSON.stringify(udKeys.result))

  await snapshot('string-ident')

  // Dump structure to check how ident is stored
  const structR = await api.v1.common.getAppVersion({})
  const inst = structR.structure.tree[String(r3.result)]
  if (inst) {
    console.log('[12] instance with ident members:')
    for (const [k, v] of Object.entries(inst.members || {})) {
      console.log('  ', k, ':', JSON.stringify(v.value))
    }
  }

  return {}
}
