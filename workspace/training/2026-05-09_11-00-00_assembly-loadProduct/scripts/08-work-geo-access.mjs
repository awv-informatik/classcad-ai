// After loadProduct, check if work geometry is accessible
export default async function (api, { filewrite }) {
  // Create a part with work geometry, save
  const p = (await api.v1.part.create({ name: 'WGPart' })).result
  await api.v1.part.box({ id: p, name: 'Body', length: 50, width: 30, height: 25 })
  const wcsId = (await api.v1.part.workCSys({
    id: p, name: 'Mate',
    origin: [25, 15, 25], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  console.log('[08] Original workCSys ID:', wcsId)

  // Verify work geo exists before save
  const wgBefore = await api.v1.part.getWorkGeometry({ id: p, name: 'Mate' })
  console.log('[08] getWorkGeometry before save:', wgBefore.result)

  const saved = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  const ofbData = saved.result.content

  // Create assembly, load product
  await api.v1.common.clear({})
  const asmId = (await api.v1.assembly.create({ name: 'WGAsm' })).result
  const tplId = (await api.v1.assembly.loadProduct({
    data: ofbData, format: 'OFB', encoding: 'base64', compression: 'deflate',
  })).result.id
  console.log('[08] Loaded template ID:', tplId)

  // Try assembly.getWorkGeometry on template
  const wg1 = await api.v1.assembly.getWorkGeometry({ id: tplId, name: 'Mate' })
  console.log('[08] assembly.getWorkGeometry on template:', JSON.stringify(wg1.result), 'maxLevel:', wg1.maxLevel)

  // Try part.getWorkGeometry on template (after setCurrentProduct to template)
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  const wg2 = await api.v1.part.getWorkGeometry({ id: tplId, name: 'Mate' })
  console.log('[08] part.getWorkGeometry on template:', JSON.stringify(wg2.result), 'maxLevel:', wg2.maxLevel)

  // Check default work geometry names too (XY, XZ, YZ planes)
  const wgXY = await api.v1.part.getWorkGeometry({ id: tplId, name: 'Top' })
  console.log('[08] part.getWorkGeometry "Top":', JSON.stringify(wgXY.result), 'maxLevel:', wgXY.maxLevel)

  // Also try assembly.getWorkGeometry on assembly root
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const wg3 = await api.v1.assembly.getWorkGeometry({ id: asmId, name: 'BaseWCSys' })
  console.log('[08] assembly.getWorkGeometry "BaseWCSys" on asm:', JSON.stringify(wg3.result), 'maxLevel:', wg3.maxLevel)

  // Instantiate and try on instance
  const inst = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId })).result
  const wg4 = await api.v1.assembly.getWorkGeometry({ id: inst, name: 'Mate' })
  console.log('[08] assembly.getWorkGeometry on instance:', JSON.stringify(wg4.result), 'maxLevel:', wg4.maxLevel)

  filewrite({
    asmOnTemplate: { result: wg1.result, maxLevel: wg1.maxLevel },
    partOnTemplate: { result: wg2.result, maxLevel: wg2.maxLevel },
    partOnTop: { result: wgXY.result, maxLevel: wgXY.maxLevel },
    asmOnAsm: { result: wg3.result, maxLevel: wg3.maxLevel },
    asmOnInstance: { result: wg4.result, maxLevel: wg4.maxLevel },
  }, 'workgeo-access')

  return { tplId }
}
