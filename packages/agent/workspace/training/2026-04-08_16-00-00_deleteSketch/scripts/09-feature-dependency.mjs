// Test deleting a sketch used as a profile for an extrusion
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId, name: 'ExtProfile' })).result

  // Create rectangle region
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })
  console.log('[09] rectangle:', rect.result, 'maxLevel:', rect.maxLevel)

  // Get sketch region
  const region = await api.v1.sketch.getSketchRegion({ id: skId, name: 'SketchRegion' })
  console.log('[09] region:', region.result, 'maxLevel:', region.maxLevel)

  if (!region.result) {
    console.log('[09] no region found, trying default name...')
    const region2 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'SketchRegion_1' })
    console.log('[09] region2:', region2.result, 'maxLevel:', region2.maxLevel)
  }

  // Try extrusion if we have a region
  const regionId = region.result
  if (regionId) {
    const ext = await api.v1.part.extrusion({
      id: partId,
      profile: regionId,
      direction: [0, 0, 50],
    })
    console.log('[09] extrusion:', ext.result, 'maxLevel:', ext.maxLevel)
    filewrite({ result: ext.result, messages: ext.messages, maxLevel: ext.maxLevel }, 'extrusion-response')

    await snapshot('before-delete')

    // Now try to delete the sketch that the extrusion depends on
    const r = await api.v1.sketch.deleteSketch({ ids: [skId] })
    console.log('[09] delete sketch result:', r.result, 'maxLevel:', r.maxLevel)
    console.log('[09] messages:', JSON.stringify(r.messages))
    filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'delete-with-feature-response')

    await snapshot('after-delete')
  } else {
    console.log('[09] SKIPPED — could not get region. Need to investigate region naming.')
  }

  return { partId }
}
