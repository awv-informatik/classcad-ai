// Verify structure tree cleanup — check actual node classes
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create sketch
  const createR = await api.v1.sketch.create({ id: partId, name: 'TreeTest' })
  const skId = createR.result
  console.log('[07b] created sketch:', skId)

  // Find sketch-related nodes in structure
  function findByClass(structure, classNames) {
    const found = []
    function walk(nodes) {
      if (!nodes) return
      for (const n of nodes) {
        if (classNames.includes(n.class)) {
          found.push({ name: n.name, class: n.class, id: n.id })
        }
        if (n.nodes) walk(n.nodes)
      }
    }
    if (structure && structure.nodes) walk(structure.nodes)
    else if (Array.isArray(structure)) walk(structure)
    return found
  }

  const sketchClasses = ['CC_Sketch', 'CC_SketchReference', 'CC_SketchDimensionSet']
  const beforeNodes = findByClass(createR.structure, sketchClasses)
  console.log('[07b] sketch nodes after create:', JSON.stringify(beforeNodes))
  filewrite(beforeNodes, 'sketch-nodes-before-delete')

  // Delete
  const delR = await api.v1.sketch.deleteSketch({ ids: [skId] })
  console.log('[07b] delete maxLevel:', delR.maxLevel)

  const afterNodes = findByClass(delR.structure, sketchClasses)
  console.log('[07b] sketch nodes after delete:', JSON.stringify(afterNodes))
  filewrite(afterNodes, 'sketch-nodes-after-delete')

  console.log('[07b] nodes removed:', beforeNodes.length - afterNodes.length)

  return { partId }
}
