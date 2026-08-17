// Test: compare from() vs loadProduct() — document the difference
// Also: can from() load an OFB assembly file? (We know it rejects non-JSON/XML/ECXML)
export default async function (api, { snapshot, filewrite }) {
  console.log('[17] Comparing from() vs loadProduct()...')

  // Build an assembly with geometry
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  const wcsId = (await api.v1.part.workCSys({
    id: tplId, name: 'WCS1',
    origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'I1' })).result

  // Export as OFB
  const exportRes = await api.v1.assembly.exportNode({ id: asmId, format: 'OFB', encoding: 'base64' })
  const ofbData = exportRes.result.content
  console.log('[17] Exported OFB, length:', ofbData.length)

  // Also save as OFB via common.save
  const saveRes = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result
  console.log('[17] Saved OFB via common.save, length:', saveRes.content.length)

  // Test 1: loadProduct with OFB data
  await api.v1.common.clear({})
  const asmId2 = (await api.v1.assembly.create({})).result
  const loadRes = await api.v1.assembly.loadProduct({
    data: ofbData,
    format: 'OFB',
    encoding: 'base64',
  })
  console.log('[17] loadProduct result:', JSON.stringify(loadRes.result), 'maxLevel:', loadRes.maxLevel)
  if (loadRes.maxLevel <= 31) {
    await snapshot('loadProduct-result')
  }
  filewrite({ result: loadRes.result, messages: loadRes.messages, maxLevel: loadRes.maxLevel }, 'loadProduct')

  // Test 2: from() with OFB data (should fail — only JSON/XML/ECXML)
  await api.v1.common.clear({})
  const fromRes1 = await api.v1.assembly.from({ data: ofbData, format: 'JSON' })
  console.log('[17] from() with OFB as JSON: maxLevel:', fromRes1.maxLevel)
  if (fromRes1.messages?.length) console.log('[17]  ', fromRes1.messages[0].message.substring(0, 120))

  // Test 3: from() with common.save data
  await api.v1.common.clear({})
  const fromRes2 = await api.v1.assembly.from({ data: saveRes.content, format: 'JSON' })
  console.log('[17] from() with common.save as JSON: maxLevel:', fromRes2.maxLevel)
  if (fromRes2.messages?.length) console.log('[17]  ', fromRes2.messages[0].message.substring(0, 120))

  // Test 4: from() with empty JSON but specifying name
  await api.v1.common.clear({})
  const fromRes3 = await api.v1.assembly.from({
    data: JSON.stringify({ name: 'CustomAsm', templates: [], instances: [], constraints: [] }),
    format: 'JSON',
  })
  console.log('[17] from() with name:', fromRes3.result, 'maxLevel:', fromRes3.maxLevel)
  // Check if root got the name
  const tree = fromRes3.structure?.tree || {}
  const root = Object.values(tree).find(n => n.class === 'CC_AssemblyRoot')
  console.log('[17] Root name:', root?.name)
  filewrite({ rootName: root?.name, result: fromRes3.result, maxLevel: fromRes3.maxLevel }, 'from-with-name')

  return {}
}
