// Test: setWorkPlane on a sketch that has been used for an extrusion
// Does the extrusion update when the sketch plane changes?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExtrusionDep' })).result
  const skId = (await api.v1.sketch.create({ id: partId, name: 'Sk1' })).result

  // Draw a rectangle profile
  await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [40, 30, 0] })
  const regionR = await api.v1.sketch.sketchRegion({ id: skId, index: 0 })
  console.log('[18] region:', regionR.result, 'maxLevel:', regionR.maxLevel)

  // Create extrusion from sketch
  const extR = await api.v1.part.extrusion({
    id: partId,
    profile: regionR.result,
    direction: [0, 0, 50],
  })
  console.log('[18] extrusion:', extR.result, 'maxLevel:', extR.maxLevel)
  await snapshot('before-move')

  // Move sketch to a plane at y=80
  const wpId = (await api.v1.part.workPlane({
    id: partId, normal: [0, 1, 0], position: [0, 80, 0],
  })).result

  const r = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpId })
  console.log('[18] setWorkPlane maxLevel:', r.maxLevel)
  console.log('[18] messages:', JSON.stringify(r.messages))
  await snapshot('after-move')

  filewrite({
    setWPMaxLevel: r.maxLevel,
    messages: r.messages,
  }, 'extrusion-dep')

  return { partId }
}
