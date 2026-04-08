// Test deleting a sketch used by an extrusion — first find the correct region name
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId, name: 'ExtProfile' })).result

  // Create rectangle
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })
  console.log('[09b] rectangle:', rect.result, 'maxLevel:', rect.maxLevel)

  // Search for sketch regions in structure tree
  function findRegions(structure) {
    const found = []
    function walk(nodes) {
      if (!nodes) return
      for (const n of nodes) {
        if (n.class && n.class.includes('SketchRegion')) {
          found.push({ name: n.name, class: n.class, id: n.id })
        }
        if (n.nodes) walk(n.nodes)
      }
    }
    if (structure && structure.nodes) walk(structure.nodes)
    else if (Array.isArray(structure)) walk(structure)
    return found
  }

  const regions = findRegions(rect.structure)
  console.log('[09b] regions found:', JSON.stringify(regions))
  filewrite(regions, 'regions')

  if (regions.length === 0) {
    // Try getting the region by various names
    for (const name of ['SketchRegion', 'SketchRegion_1', 'SketchRegion_0', 'Region', 'Region_1']) {
      const r = await api.v1.sketch.getSketchRegion({ id: skId, name })
      if (r.result) {
        console.log(`[09b] found region with name '${name}':`, r.result)
        regions.push({ name, id: r.result })
        break
      }
    }
  }

  if (regions.length > 0) {
    const regionId = regions[0].id
    console.log('[09b] using region:', regionId)

    // Create extrusion
    const ext = await api.v1.part.extrusion({
      id: partId,
      profile: regionId,
      direction: [0, 0, 50],
    })
    console.log('[09b] extrusion result:', ext.result, 'maxLevel:', ext.maxLevel)
    if (ext.messages.length) console.log('[09b] extrusion messages:', JSON.stringify(ext.messages))
    filewrite({ result: ext.result, messages: ext.messages, maxLevel: ext.maxLevel }, 'extrusion-response')

    if (ext.maxLevel <= 31) {
      await snapshot('before-delete')

      // Try deleting the sketch that the extrusion uses
      const delR = await api.v1.sketch.deleteSketch({ ids: [skId] })
      console.log('[09b] delete result:', delR.result, 'maxLevel:', delR.maxLevel)
      console.log('[09b] delete messages:', JSON.stringify(delR.messages))
      filewrite({ result: delR.result, messages: delR.messages, maxLevel: delR.maxLevel }, 'delete-with-feature-response')

      await snapshot('after-delete')
    }
  } else {
    console.log('[09b] no regions found at all — cannot test feature dependency')
  }

  return { partId }
}
