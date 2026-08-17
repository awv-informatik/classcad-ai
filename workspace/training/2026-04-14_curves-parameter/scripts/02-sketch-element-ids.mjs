// Test the sketch element IDs form of the `curves` parameter
// Create a sketch on the part, draw a rectangle, pass the element IDs as an array
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchCurvesTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create a sketch on the part
  const skId = (await api.v1.sketch.create({ id: partId })).result
  console.log('[02] sketchId:', skId)

  // Draw a rectangle — returns array of line IDs
  const rectResult = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [60, 40, 0],
  })
  console.log('[02] rectangle result:', rectResult.result, 'maxLevel:', rectResult.maxLevel)
  console.log('[02] lineIds type:', Array.isArray(rectResult.result) ? 'array' : typeof rectResult.result)
  console.log('[02] lineIds:', JSON.stringify(rectResult.result))

  const lineIds = rectResult.result

  // Pass array of sketch element IDs as curves
  const extResult = await api.v1.solid.extrusion({
    id: eifId,
    direction: [0, 0, 30],
    curves: lineIds,
  })

  console.log('[02] extrusion result:', extResult.result, 'maxLevel:', extResult.maxLevel)
  if (extResult.messages?.length) {
    console.log('[02] messages:', JSON.stringify(extResult.messages))
  }

  filewrite({
    sketchId: skId,
    lineIds,
    extResult: { result: extResult.result, maxLevel: extResult.maxLevel, messages: extResult.messages },
  }, 'sketch-element-ids')

  await snapshot('sketch-element-extrusion')
  return { partId, eifId, skId, lineIds, extId: extResult.result }
}
