export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Internals' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  const viewR = await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'ISO'] })
  console.log('[08] view IDs:', JSON.stringify(viewR.result))

  // Dump full view node details from structure tree
  const tree = viewR.structure.tree
  const viewDetails = {}
  for (const [nid, node] of Object.entries(tree)) {
    if (node.class === 'CC_View2D' || node.class === 'CC_ViewSet') {
      viewDetails[nid] = node
    }
  }
  filewrite(viewDetails, 'view-node-details')

  // Try getBoundaryBoxFromView to see view extents
  const bbR = await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP', 'FRONT', 'ISO'] })
  console.log('[08] bboxes result:', JSON.stringify(bbR.result))
  console.log('[08] bboxes maxLevel:', bbR.maxLevel)
  filewrite({ result: bbR.result, messages: bbR.messages, maxLevel: bbR.maxLevel }, 'bboxes')

  // Try with empty types to get all
  const bbAllR = await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: [] })
  console.log('[08] all bboxes:', JSON.stringify(bbAllR.result))

  return { partId }
}
