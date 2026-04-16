// How to get solid IDs from part features for use with requestVisualisation
// Since requestVisualisation needs solid IDs (not feature IDs), we need to find them
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VisFindSolid' })).result
  const boxFeatId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result
  console.log('[11] partId:', partId, 'boxFeatId:', boxFeatId)

  // The structure tree from a regular API call contains the object hierarchy
  // After creating the box, look at the structure to find the solid
  const r = await api.v1.part.box({ id: partId, name: 'Cyl1', length: 20, width: 20, height: 20, translation: [80, 0, 0] })

  // Use structure to find solid IDs
  // The structure is a tree — look for CC_Solid nodes
  if (r.structure) {
    // Walk structure looking for CC_Solid objects
    const solids = []
    function findSolids(node) {
      if (node.class === 'CC_Solid' || node.class === 'CC_SolidBody') {
        solids.push({ id: node.id, name: node.name, class: node.class })
      }
      if (node.children) {
        for (const child of node.children) {
          findSolids(child)
        }
      }
    }

    if (Array.isArray(r.structure)) {
      r.structure.forEach(findSolids)
    } else if (typeof r.structure === 'object') {
      findSolids(r.structure)
    }
    console.log('[11] found solids:', JSON.stringify(solids))
    filewrite(solids, 'found-solids')

    // Also try requestVisualisation with each found solid ID
    for (const s of solids) {
      const rVis = await api.v1.common.requestVisualisation({ ids: [s.id] })
      console.log(`[11] requestVis(${s.id} ${s.class}): graphic?`, !!rVis.graphic,
        'containers:', rVis.graphic?.containers?.length)
    }
  }

  // Alternative approach: use the first API result's structure to find the CC_GraphicContainer
  const rBox = await api.v1.common.requestVisualisation({ ids: [boxFeatId] })
  console.log('[11] direct boxFeatId:', !!rBox.graphic)

  await snapshot('find-solid')
  return { partId }
}
