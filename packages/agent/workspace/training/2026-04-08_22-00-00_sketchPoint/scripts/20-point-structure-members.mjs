// Deep dive: CC_Point structure members and properties
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'StructTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a point and inspect its full structure node
  const r = await api.v1.sketch.point({ id: skId, pos: [30, 20, 0] })
  const pointNode = r.structure.tree[r.result]
  console.log('[20] full point node:', JSON.stringify(pointNode, null, 2))

  // Also check the sketch node's children
  const sketchNode = r.structure.tree[skId]
  console.log('[20] sketch children:', JSON.stringify(sketchNode?.children))
  console.log('[20] sketch members:', JSON.stringify(Object.keys(sketchNode?.members || {})))

  filewrite(pointNode, 'point-node-detail')
  filewrite(sketchNode, 'sketch-node-detail')
  return { partId, skId }
}
