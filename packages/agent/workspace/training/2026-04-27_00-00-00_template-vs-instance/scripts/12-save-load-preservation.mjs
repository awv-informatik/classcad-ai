export default async function (api, { snapshot, filewrite }) {
  // Test: save assembly, clear, load — does template/instance relationship survive?
  const asmId = (await api.v1.assembly.create({ name: 'SaveLoadTest' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Cube' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 30, width: 30, height: 30 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'CubeA' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'CubeB',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Save
  const saveR = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  console.log('[12] save maxLevel:', saveR.maxLevel, 'content length:', saveR.result?.content?.length)

  // Record IDs before clear
  console.log('[12] BEFORE — asmId:', asmId, 'tpl:', tpl, 'inst1:', inst1, 'inst2:', inst2)

  // Clear
  await api.v1.common.clear({})

  // Load
  const loadR = await api.v1.common.load({ data: saveR.result.content, format: 'OFB', encoding: 'base64' })
  console.log('[12] load result:', JSON.stringify(loadR.result))

  // Check structure after load
  const r = await api.v1.common.getAppVersion({})
  console.log('[12] AFTER — root:', r.structure.root, 'currentProduct:', r.structure.currentProduct)

  const newAsmId = r.structure.root
  const allParts = (await api.v1.assembly.getPartTemplate()).result
  console.log('[12] part templates after load:', allParts)

  const allInsts = (await api.v1.assembly.getInstance({ ownerId: newAsmId })).result
  console.log('[12] instances after load:', allInsts)

  // Check productId links are preserved
  for (const instId of allInsts) {
    const node = r.structure.tree[instId]
    if (node) {
      console.log('[12] inst', instId, ':', node.name, 'productId:', node.members?.productId?.value)
    }
  }

  // Verify instances still share the same template
  const prodIds = allInsts.map(id => r.structure.tree[id]?.members?.productId?.value)
  console.log('[12] all productIds:', prodIds, 'same?', new Set(prodIds).size === 1)

  await snapshot('after-load')
  return { newAsmId }
}
