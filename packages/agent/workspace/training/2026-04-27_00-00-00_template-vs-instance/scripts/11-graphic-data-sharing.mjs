export default async function (api, { snapshot, filewrite }) {
  // Test: how does graphic data differ between templates and instances?
  const asmId = (await api.v1.assembly.create({ name: 'GraphicTest' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'TestPart' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Inst1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Inst2',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Get graphic data and compare
  const r = await api.v1.common.requestVisualisation({ id: asmId })
  console.log('[11] requestVisualisation maxLevel:', r.maxLevel)

  // Examine graphic data
  if (r.graphic) {
    const gKeys = Object.keys(r.graphic)
    console.log('[11] graphic top-level keys:', gKeys)

    // Check if graphic has per-instance vs per-template mesh data
    if (r.graphic.meshes) {
      console.log('[11] mesh count:', r.graphic.meshes.length)
      for (let i = 0; i < r.graphic.meshes.length; i++) {
        const m = r.graphic.meshes[i]
        console.log('[11] mesh', i, '- id:', m.id, 'vertexCount:', m.vertices?.length / 3, 'hash:', m.hash?.substring(0, 20))
      }
    }
    filewrite(r.graphic, 'graphic-data')
  } else {
    console.log('[11] no graphic data returned')
  }

  // Also check structure for graphic-related members on instances
  const struct = r.structure
  for (const instId of [inst1, inst2]) {
    const node = struct?.tree?.[instId]
    if (node) {
      console.log('[11] inst', instId, 'flags:', node.flags)
    }
  }

  // Test: what does the structure look like for the template inside PartContainer?
  // Does the template also have graphic data?
  const tplNode = struct?.tree?.[tpl]
  if (tplNode) {
    console.log('[11] template flags:', tplNode.flags, 'children:', tplNode.children?.length)
  }

  return { asmId }
}
