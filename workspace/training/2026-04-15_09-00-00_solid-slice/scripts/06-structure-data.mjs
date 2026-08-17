// Verify slice using structure data instead of graphic data
// The structure tree should show the solid's bounding box or face data
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceStruct' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create box 80x60x40
  const boxR = await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })
  const boxId = boxR.result
  console.log('[06] boxId:', boxId)

  // Dump keys of the response to understand what's available
  console.log('[06] response keys:', Object.keys(boxR).join(', '))
  console.log('[06] graphic keys:', boxR.graphic ? Object.keys(boxR.graphic).join(', ') : 'null')

  // filewrite the graphic object to see its full shape
  filewrite(boxR.graphic, 'graphic-raw-before')

  // Also dump structure — but only a small portion (it's huge)
  // Focus on finding bounding box info
  if (boxR.structure) {
    // Try to find the solid node in the structure tree
    const findNode = (node, id) => {
      if (node.id === id) return node
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child, id)
          if (found) return found
        }
      }
      return null
    }
    const solidNode = findNode(boxR.structure, boxId)
    if (solidNode) {
      console.log('[06] solid node keys:', Object.keys(solidNode).join(', '))
      filewrite(solidNode, 'solid-node-before')
    } else {
      console.log('[06] solid node not found in structure')
      // Dump just top-level structure shape
      const topLevel = {
        keys: Object.keys(boxR.structure),
        id: boxR.structure.id,
        type: boxR.structure.type,
        name: boxR.structure.name,
        childCount: boxR.structure.children?.length,
      }
      console.log('[06] structure top:', JSON.stringify(topLevel))
    }
  }

  // Now slice
  const sliceR = await api.v1.solid.slice({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 20],
    normal: [0, 0, 1],
    keepBoth: false,
  })
  console.log('[06] slice result:', sliceR.result, 'maxLevel:', sliceR.maxLevel)

  // Dump graphic after
  filewrite(sliceR.graphic, 'graphic-raw-after')

  await snapshot('after-slice')

  return { partId, boxId }
}
