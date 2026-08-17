// Investigate: when multiple unnamed sketches are created, what names do they get?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const sk1 = (await api.v1.part.sketch({ id: partId })).result
  const sk2 = (await api.v1.part.sketch({ id: partId })).result
  const r3 = await api.v1.part.sketch({ id: partId })
  const sk3 = r3.result
  console.log('[14] sketch IDs:', sk1, sk2, sk3)

  // Structure is a flat map: { tree: { "id": { name, class, ... } } }
  const tree = r3.structure.tree
  const sketchNodes = []
  for (const [id, node] of Object.entries(tree)) {
    if (node.class === 'CC_Sketch') {
      sketchNodes.push({ id: node.id, name: node.name })
    }
  }

  console.log('[14] sketch nodes from structure:')
  for (const sn of sketchNodes) {
    console.log(`  id=${sn.id} name="${sn.name}"`)
  }

  // Try to find each by its actual name
  for (const sn of sketchNodes) {
    const r = await api.v1.part.getSketch({ id: partId, name: sn.name })
    console.log(`[14] getSketch("${sn.name}") -> ${r.result} (expected ${sn.id}, match=${r.result === sn.id})`)
  }

  filewrite(sketchNodes, 'sketch-nodes')

  return { partId }
}
