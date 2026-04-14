// Test extrusion using sketch element IDs instead of curve shape IDs
// The docs say curves can be "array of sketch element ids or a shape id"
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchCurvesTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create a sketch inside the EIF (not a shape)
  // First, let's try using sketch.create with the part, then sketch elements
  const skId = (await api.v1.sketch.create({ id: partId })).result
  console.log('[09] sketchId:', skId)

  // Draw a rectangle in the sketch
  const rectR = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [50, 30, 0],
  })
  console.log('[09] rectangle result:', rectR.result, 'maxLevel:', rectR.maxLevel)

  // Try to pass sketch element IDs to extrusion
  // rectangle returns an array of line IDs
  const lineIds = rectR.result
  console.log('[09] lineIds:', lineIds)

  // Try extrusion with sketch element IDs
  const r = await api.v1.solid.extrusion({
    id: eifId,
    direction: [0, 0, 40],
    curves: lineIds,
  })
  console.log('[09] extrusion with sketch IDs result:', r.result)
  console.log('[09] maxLevel:', r.maxLevel)
  console.log('[09] messages:', JSON.stringify(r.messages))

  filewrite({
    sketchId: skId,
    lineIds,
    extrusionResult: r.result,
    maxLevel: r.maxLevel,
    messages: r.messages,
  }, 'sketch-curves')

  if (r.result) {
    await snapshot('sketch-curves')
  }
  return { partId }
}
