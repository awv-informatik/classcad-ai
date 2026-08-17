export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Overwrite' })).result
  await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })

  // First view call
  const r1 = await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT'] })
  console.log('[03] first call IDs:', JSON.stringify(r1.result))

  // Count CC_View2D nodes after first call
  let viewCount1 = 0
  for (const node of Object.values(r1.structure.tree)) {
    if (node.class === 'CC_View2D') viewCount1++
  }
  console.log('[03] view nodes after first call:', viewCount1)

  // Second view call — different types
  const r2 = await api.v1.drawing2d.view({ id: partId, types: ['RIGHT', 'ISO'] })
  console.log('[03] second call IDs:', JSON.stringify(r2.result))

  // Count CC_View2D nodes after second call
  let viewCount2 = 0
  const viewNames2 = []
  for (const [nid, node] of Object.entries(r2.structure.tree)) {
    if (node.class === 'CC_View2D') {
      viewCount2++
      viewNames2.push({ id: parseInt(nid), name: node.name })
    }
  }
  console.log('[03] view nodes after second call:', viewCount2)
  console.log('[03] view names after second:', JSON.stringify(viewNames2))

  // Check if first call's IDs are still in the tree
  for (const id of r1.result) {
    const inTree = String(id) in r2.structure.tree
    console.log('[03] first call ID', id, 'still in tree:', inTree)
  }

  filewrite({ firstCallIds: r1.result, secondCallIds: r2.result, viewsAfterSecond: viewNames2 }, 'overwrite-data')

  // Third call: same types as first, do they come back?
  const r3 = await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT'] })
  console.log('[03] third call (same as first) IDs:', JSON.stringify(r3.result))

  let viewCount3 = 0
  const viewNames3 = []
  for (const [nid, node] of Object.entries(r3.structure.tree)) {
    if (node.class === 'CC_View2D') {
      viewCount3++
      viewNames3.push({ id: parseInt(nid), name: node.name })
    }
  }
  console.log('[03] view nodes after third call:', viewCount3, JSON.stringify(viewNames3))

  return { partId }
}
