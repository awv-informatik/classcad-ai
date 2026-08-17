// Examine the full recalc response envelope — structure tree contents (fixed)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EnvelopeTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })).result

  // Get full recalc response
  const r = await api.v1.common.recalc()
  console.log('[10] result:', r.result)
  console.log('[10] maxLevel:', r.maxLevel)
  console.log('[10] messages count:', (r.messages || []).length)
  console.log('[10] envelope keys:', Object.keys(r))
  console.log('[10] has structure:', !!r.structure)
  console.log('[10] has graphic:', !!r.graphic)

  // Dump structure tree shape
  if (r.structure) {
    const structKeys = Object.keys(r.structure)
    console.log('[10] structure keys:', structKeys)
    const treeType = typeof r.structure.tree
    console.log('[10] tree type:', treeType)
    if (treeType === 'object' && r.structure.tree !== null) {
      console.log('[10] tree keys:', Object.keys(r.structure.tree))
    }
    filewrite({
      root: r.structure.root,
      currentProduct: r.structure.currentProduct,
      currentInstance: r.structure.currentInstance,
      testRoot: r.structure.testRoot,
      treeType: treeType,
      treeIsArray: Array.isArray(r.structure.tree),
      treeKeys: treeType === 'object' && r.structure.tree ? Object.keys(r.structure.tree) : null,
    }, 'recalc-structure-summary')
  }

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages, envelopeKeys: Object.keys(r) }, 'recalc-envelope')

  return { result: r.result, maxLevel: r.maxLevel, hasStructure: !!r.structure, hasGraphic: !!r.graphic }
}
