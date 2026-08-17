export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result

  // Create a sketch
  const skId = (await api.v1.part.sketch({ id: partId, name: 'MySketch' })).result
  console.log('[09] sketchId:', skId)

  // Try to find the sketch
  const rSk = await api.v1.part.getFeature({ id: partId, name: 'MySketch' })
  console.log('[09] "MySketch":', rSk.result, 'maxLevel:', rSk.maxLevel)

  // Create a rectangle in the sketch for extrusion
  await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [50, 50, 0] })
  const regionId = (await api.v1.part.getSketchRegion({ id: skId, index: 0 })).result

  // Create an extrusion
  const extId = (await api.v1.part.extrusion({
    id: partId,
    name: 'MyExtrusion',
    profile: regionId,
    direction: [0, 0, 40],
  })).result
  console.log('[09] extrusionId:', extId)

  const rExt = await api.v1.part.getFeature({ id: partId, name: 'MyExtrusion' })
  console.log('[09] "MyExtrusion":', rExt.result, 'match:', rExt.result === extId)

  // Also check default sketch name
  const rDefSk = await api.v1.part.getFeature({ id: partId, name: 'Sketch' })
  console.log('[09] "Sketch" (default):', rDefSk.result, 'maxLevel:', rDefSk.maxLevel)

  filewrite({
    sketch: { id: skId, found: rSk.result, maxLevel: rSk.maxLevel },
    extrusion: { id: extId, found: rExt.result, maxLevel: rExt.maxLevel },
    defaultSketch: { found: rDefSk.result, maxLevel: rDefSk.maxLevel },
  }, 'sketch-extrusion')

  return { partId }
}
