// Test deleting a sketch used by an extrusion — try passing lines directly
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId, name: 'ExtProfile' })).result

  // Create rectangle
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })
  const lineIds = rect.result
  console.log('[09e] rectangle lines:', lineIds)

  // Try extrusion with lines directly as references
  const ext = await api.v1.part.extrusion({
    id: partId,
    references: lineIds,
    limit2: 50,
  })
  console.log('[09e] extrusion result:', ext.result, 'maxLevel:', ext.maxLevel)
  if (ext.messages.length) console.log('[09e] extrusion messages:', JSON.stringify(ext.messages))
  filewrite({ result: ext.result, messages: ext.messages, maxLevel: ext.maxLevel }, 'extrusion-response')

  // Check if we have geometry (graphic data)
  if (ext.graphic) {
    const containers = ext.graphic.containers || []
    const meshCount = containers.reduce((acc, c) => acc + (c.meshes ? c.meshes.length : 0), 0)
    console.log('[09e] containers:', containers.length, 'meshes:', meshCount)
  }

  if (ext.result && ext.maxLevel <= 51) {
    await snapshot('before-delete')

    // Now try to delete the sketch
    const delR = await api.v1.sketch.deleteSketch({ ids: [skId] })
    console.log('[09e] delete result:', delR.result, 'maxLevel:', delR.maxLevel)
    console.log('[09e] delete messages:', JSON.stringify(delR.messages))
    filewrite({ result: delR.result, messages: delR.messages, maxLevel: delR.maxLevel }, 'delete-response')

    await snapshot('after-delete')

    // Check what remains
    const tree = delR.structure.tree
    const remaining = []
    for (const [id, node] of Object.entries(tree)) {
      if (node.class && (node.class.includes('Extrusion') || node.class.includes('Sketch'))) {
        remaining.push({ id: node.id, name: node.name, class: node.class })
      }
    }
    console.log('[09e] remaining sketch/extrusion nodes:', JSON.stringify(remaining))
    filewrite(remaining, 'remaining-nodes')
  }

  return { partId }
}
