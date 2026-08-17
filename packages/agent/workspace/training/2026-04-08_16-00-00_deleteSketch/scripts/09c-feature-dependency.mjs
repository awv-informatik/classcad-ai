// Test deleting a sketch used by an extrusion
// sketchRegion must be explicitly created from geometry
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId, name: 'ExtProfile' })).result

  // Create rectangle
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })
  const lineIds = rect.result  // Array of 4 line IDs
  console.log('[09c] rectangle lines:', lineIds)

  // Create sketch region from the rectangle geometry
  const regionR = await api.v1.sketch.sketchRegion({ id: skId, geomIds: lineIds })
  console.log('[09c] sketchRegion result:', regionR.result, 'maxLevel:', regionR.maxLevel)
  if (regionR.messages.length) console.log('[09c] region messages:', JSON.stringify(regionR.messages))

  if (!regionR.result || regionR.maxLevel > 31) {
    console.log('[09c] FAILED to create region, aborting')
    filewrite({ result: regionR.result, messages: regionR.messages, maxLevel: regionR.maxLevel }, 'region-fail')
    return { partId }
  }

  const regionId = regionR.result

  // Create extrusion from the region
  const ext = await api.v1.part.extrusion({
    id: partId,
    profile: regionId,
    direction: [0, 0, 50],
  })
  console.log('[09c] extrusion result:', ext.result, 'maxLevel:', ext.maxLevel)
  if (ext.messages.length) console.log('[09c] extrusion messages:', JSON.stringify(ext.messages))

  if (ext.maxLevel > 31) {
    console.log('[09c] FAILED to create extrusion, aborting')
    filewrite({ result: ext.result, messages: ext.messages, maxLevel: ext.maxLevel }, 'extrusion-fail')
    return { partId }
  }

  await snapshot('before-delete')

  // Now delete the sketch that the extrusion depends on
  const delR = await api.v1.sketch.deleteSketch({ ids: [skId] })
  console.log('[09c] delete result:', delR.result, 'maxLevel:', delR.maxLevel)
  console.log('[09c] delete messages:', JSON.stringify(delR.messages))
  filewrite({ result: delR.result, messages: delR.messages, maxLevel: delR.maxLevel }, 'delete-with-feature-response')

  await snapshot('after-delete')

  // Check: is the extrusion/solid still there?
  // Look at structure for solids
  function findSolids(tree) {
    const solids = []
    for (const [id, node] of Object.entries(tree)) {
      if (node.class && node.class.includes('Solid')) {
        solids.push({ id: node.id, name: node.name, class: node.class })
      }
    }
    return solids
  }
  const solidsAfter = findSolids(delR.structure.tree)
  console.log('[09c] solids after sketch delete:', JSON.stringify(solidsAfter))
  filewrite(solidsAfter, 'solids-after-delete')

  return { partId }
}
