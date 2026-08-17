// Test: create a real assembly, dump its structure tree,
// and try to construct the JSON format from what we see
export default async function (api, { snapshot, filewrite }) {
  console.log('[10] Building assembly and dumping structure for reverse-engineering...')

  // Build a simple assembly with one part template and two instances
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  const boxId = (await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })).result
  const wcsId = (await api.v1.part.workCSys({
    id: tplId, name: 'Mate1',
    origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst2',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  console.log('[10] Built:', { asmId, tplId, boxId, wcsId, inst1, inst2 })

  // Dump the full structure tree
  const getStructure = await api.v1.assembly.setCurrentProduct({ id: asmId })
  filewrite(getStructure.structure, 'full-structure')

  // Now try exporting the assembly using exportNode in OFB, then re-import
  // to see if assembly.from can work with a known-good OFB
  const exportRes = await api.v1.assembly.exportNode({ id: asmId, format: 'OFB', encoding: 'base64' })
  console.log('[10] exportNode OFB:', 'success:', exportRes.result?.success, 'contentLen:', exportRes.result?.content?.length)
  filewrite({ success: exportRes.result?.success, contentLen: exportRes.result?.content?.length, messages: exportRes.messages }, 'export-meta')

  if (exportRes.result?.content) {
    // Try loadProduct with this OFB data (not from — loadProduct accepts OFB)
    await api.v1.common.clear({})
    const asmId2 = (await api.v1.assembly.create({})).result
    const loadRes = await api.v1.assembly.loadProduct({
      data: exportRes.result.content,
      encoding: 'base64',
      format: 'OFB',
    })
    console.log('[10] loadProduct OFB:', 'result:', loadRes.result, 'maxLevel:', loadRes.maxLevel)
    filewrite({ result: loadRes.result, messages: loadRes.messages, maxLevel: loadRes.maxLevel }, 'loadProduct-result')

    if (loadRes.maxLevel <= 31 && loadRes.result?.id) {
      // If loadProduct succeeded, snapshot to see what we got
      await snapshot('loaded-product')
      // Dump its structure
      filewrite(loadRes.structure, 'loaded-structure')
    }
  }

  return {}
}
