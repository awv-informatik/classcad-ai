// Test deleting a sketch used by an extrusion
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId, name: 'ExtProfile' })).result

  // Create rectangle
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })
  const lineIds = rect.result
  console.log('[09d] rectangle lines:', lineIds)

  // Create sketch region from the rectangle geometry
  const regionR = await api.v1.sketch.sketchRegion({ id: skId, geomIds: lineIds })
  const regionId = regionR.result
  console.log('[09d] region:', regionId, 'maxLevel:', regionR.maxLevel)

  // Create extrusion using references=[regionId]
  const ext = await api.v1.part.extrusion({
    id: partId,
    references: [regionId],
    limit2: 50,
  })
  console.log('[09d] extrusion result:', ext.result, 'maxLevel:', ext.maxLevel)
  if (ext.messages.length) console.log('[09d] extrusion messages:', JSON.stringify(ext.messages))

  if (ext.maxLevel > 31) {
    filewrite({ result: ext.result, messages: ext.messages, maxLevel: ext.maxLevel }, 'extrusion-fail')
    console.log('[09d] FAILED to create extrusion')
    return { partId }
  }

  await snapshot('before-delete')

  // Now delete the sketch that the extrusion depends on
  const delR = await api.v1.sketch.deleteSketch({ ids: [skId] })
  console.log('[09d] delete result:', delR.result, 'maxLevel:', delR.maxLevel)
  console.log('[09d] delete messages:', JSON.stringify(delR.messages))
  filewrite({ result: delR.result, messages: delR.messages, maxLevel: delR.maxLevel }, 'delete-with-feature-response')

  await snapshot('after-delete')

  // Check structure for solids and extrusion feature
  const tree = delR.structure.tree
  for (const [id, node] of Object.entries(tree)) {
    if (node.class && (node.class.includes('Extrusion') || node.class.includes('Solid') || node.class.includes('Sketch'))) {
      console.log('[09d] remaining:', id, node.name, node.class)
    }
  }

  return { partId }
}
