// 09 — Using a work plane as sketch parent + mirror reference
// Tests realistic usage: create workplane → sketch on it → extrude
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a work plane offset 50 above origin (XY plane at z=50)
  const wpId = (await api.v1.part.workPlane({
    id: partId, name: 'WP_sketch',
    normal: [0, 0, 1], offset: 50
  })).result
  console.log('[09] workPlane id:', wpId)

  // Create a sketch ON the work plane
  const skId = (await api.v1.sketch.create({ id: partId, plane: wpId })).result
  console.log('[09] sketch id:', skId, '(plane param =', wpId, ')')

  // Draw a rectangle on the sketch
  const lines = (await api.v1.sketch.rectangle({ id: skId, startPos: [-30, -20, 0], endPos: [30, 20, 0] })).result
  console.log('[09] rectangle lines:', lines?.length)

  // Get sketch region
  const regionR = await api.v1.sketch.sketchRegion({ id: skId })
  const regionId = regionR.result
  console.log('[09] region:', regionId, 'maxLevel:', regionR.maxLevel)

  // Extrude from the sketch
  if (regionId) {
    const extR = await api.v1.part.extrusion({ id: partId, profile: regionId, direction: [0, 0, 30] })
    console.log('[09] extrusion:', extR.result, 'maxLevel:', extR.maxLevel)
    if (extR.messages?.length) console.log('[09] ext msgs:', JSON.stringify(extR.messages))
  }

  await snapshot('sketch-on-workplane')
  return { partId, wpId, skId }
}
