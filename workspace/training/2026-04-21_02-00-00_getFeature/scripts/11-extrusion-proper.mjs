export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result

  // Create sketch — part.sketch returns the sketch ID directly
  const skId = (await api.v1.part.sketch({ id: partId })).result
  await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [50, 50, 0] })
  const regionId = (await api.v1.part.getSketchRegion({ id: skId, index: 0 })).result
  console.log('[11] skId:', skId, 'regionId:', regionId)

  // Create extrusion with custom name
  const extR = await api.v1.part.extrusion({
    id: partId,
    name: 'MyExtrusion',
    profile: regionId,
    direction: [0, 0, 40],
  })
  const extId = extR.result
  console.log('[11] extrusionId:', extId, 'maxLevel:', extR.maxLevel)

  // Look up the extrusion
  const rExt = await api.v1.part.getFeature({ id: partId, name: 'MyExtrusion' })
  console.log('[11] "MyExtrusion":', rExt.result, 'match:', rExt.result === extId)

  // Sketch is NOT findable via getFeature (confirmed in script 09)
  const rSk = await api.v1.part.getFeature({ id: partId, name: 'Sketch' })
  console.log('[11] "Sketch" via getFeature:', rSk.result, '(expected null)')

  // But IS findable via getSketch
  const rSk2 = await api.v1.part.getSketch({ id: partId, name: 'Sketch' })
  console.log('[11] "Sketch" via getSketch:', rSk2.result, 'match:', rSk2.result === skId)

  filewrite({
    extrusion: { id: extId, found: rExt.result, match: rExt.result === extId, maxLevel: rExt.maxLevel },
    sketchViaGetFeature: { result: rSk.result, maxLevel: rSk.maxLevel },
    sketchViaGetSketch: { result: rSk2.result, match: rSk2.result === skId },
  }, 'extrusion-proper')

  return { partId }
}
