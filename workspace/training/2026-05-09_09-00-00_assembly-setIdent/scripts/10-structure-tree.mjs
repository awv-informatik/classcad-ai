export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'StructTree' })).result

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1', ident: 'my_ident_1'
  })).result
  console.log('[10] inst1:', inst1)

  // Also set ident on assembly itself
  await api.v1.assembly.setIdent({ id: asmId, ident: 'root_asm' })

  // Get the full structure tree and look for ident fields
  const r = await api.v1.assembly.getInstance({ ownerId: asmId })
  filewrite({ structure: r.structure }, 'full-structure')

  // Also try a direct API call to see structure
  const info = await api.v1.common.batch({
    jobs: [
      { api: 'v1.common.getAppVersion' }
    ]
  })
  // Use the structure from the instance call
  // Search for 'ident' or 'my_ident_1' in the structure
  const structStr = JSON.stringify(r.structure)
  const hasIdent = structStr.includes('my_ident_1')
  const hasIdentField = structStr.includes('"ident"')
  console.log('[10] structure contains ident value:', hasIdent)
  console.log('[10] structure has ident field:', hasIdentField)

  // Also check the setIdent call's structure
  const r2 = await api.v1.assembly.setIdent({ id: inst1, ident: 'changed_ident' })
  const structStr2 = JSON.stringify(r2.structure)
  const hasNewIdent = structStr2.includes('changed_ident')
  console.log('[10] setIdent response structure contains new ident:', hasNewIdent)
  filewrite({ structureKeys: Object.keys(r2.structure || {}), hasIdent: hasNewIdent }, 'setIdent-structure')

  // Test: what does the ident field look like in the structure tree?
  // Search for CC_ProductReferenceET nodes (instances)
  function findNodes(obj, typeName, results = []) {
    if (!obj || typeof obj !== 'object') return results
    if (obj.typeName === typeName || obj.type === typeName) results.push(obj)
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) v.forEach(item => findNodes(item, typeName, results))
      else if (typeof v === 'object' && v !== null) findNodes(v, typeName, results)
    }
    return results
  }

  const prefs = findNodes(r.structure, 'CC_ProductReferenceET')
  console.log('[10] CC_ProductReferenceET nodes found:', prefs.length)
  if (prefs.length > 0) {
    filewrite(prefs[0], 'instance-node')
    const nodeStr = JSON.stringify(prefs[0])
    console.log('[10] instance node has ident:', nodeStr.includes('ident'))
  }

  return { asmId }
}
