// Practical workflow: create sketch, look it up by name, use it for extrusion
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WorkflowTest' })).result

  // Create named sketch with geometry
  const skId = (await api.v1.part.sketch({ id: partId, name: 'ProfileSketch' })).result
  await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })
  await snapshot('sketch')

  // Retrieve sketch by name (simulating a workflow where you don't have the ID handy)
  const foundId = (await api.v1.part.getSketch({ id: partId, name: 'ProfileSketch' })).result
  console.log('[15] looked up sketch:', foundId, 'matches original:', foundId === skId)

  // Get sketch region for extrusion
  const regionR = await api.v1.part.getSketchRegion({ id: partId, name: 'ProfileSketch' })
  console.log('[15] getSketchRegion result:', regionR.result, 'maxLevel:', regionR.maxLevel)

  if (regionR.result) {
    const extR = await api.v1.part.extrusion({ id: partId, profiles: [{ sketch: foundId, regions: [regionR.result] }], direction: [0, 0, 40] })
    console.log('[15] extrusion result:', extR.result, 'maxLevel:', extR.maxLevel)
    await snapshot('solid')

    filewrite({
      sketchId: skId, foundId, regionId: regionR.result,
      extrusionId: extR.result, extrusionMaxLevel: extR.maxLevel,
    }, 'workflow-result')
  } else {
    console.log('[15] no region found — skipping extrusion')
    filewrite({ sketchId: skId, foundId, regionResult: regionR.result, regionMessages: regionR.messages }, 'workflow-result')
  }

  return { partId }
}
