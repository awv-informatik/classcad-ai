// Test basic assembly.loadProduct with OFB data
// 1. Create a standalone part with a box, save as OFB
// 2. Clear, create assembly, loadProduct with the OFB data
// 3. Check return value and structure
export default async function (api, { snapshot, filewrite }) {
  // Step 1: Create a part with geometry and save it
  const partId = (await api.v1.part.create({ name: 'BoxPart' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 20 })).result
  console.log('[01] Created part:', partId, 'box:', boxId)

  const saved = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  console.log('[01] Save success:', saved.result.success, 'content length:', saved.result.content.length)
  const ofbData = saved.result.content

  // Step 2: Clear and create assembly
  await api.v1.common.clear({})
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  console.log('[01] Assembly created:', asmId)

  // Step 3: Load the product
  const loadResult = await api.v1.assembly.loadProduct({
    data: ofbData,
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })
  console.log('[01] loadProduct result:', JSON.stringify(loadResult.result))
  console.log('[01] loadProduct maxLevel:', loadResult.maxLevel)
  console.log('[01] loadProduct messages:', JSON.stringify(loadResult.messages))

  // Dump the structure to see where the loaded product ended up
  filewrite(loadResult.result, 'load-result')
  filewrite(loadResult.structure, 'structure-after-load')

  await snapshot('after-load')
  return { asmId, loadResult: loadResult.result }
}
