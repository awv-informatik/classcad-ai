// Follow-up: isSolved returned null — investigate if this is a client-side unwrapping issue
// The client.mjs has unwrapping logic at lines 68-71 that strips double-wrapped results
export default async function (api) {
  // Create a part + sketch with geometry for isSolved
  const partId = (await api.v1.part.create({ name: 'BoolTest2' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [50, 50, 0] })

  // Call isSolved and dump everything
  const r = await api.v1.sketch.isSolved({ id: skId })
  console.log(`[bool-deep] isSolved full: ${JSON.stringify(r)}`)
  console.log(`[bool-deep] result: ${JSON.stringify(r.result)} type=${typeof r.result}`)
  console.log(`[bool-deep] maxLevel: ${r.maxLevel}`)

  // Try other boolean-returning APIs
  // moveGeometry returned 0 — let's also check updateDimension
  // First add a dimension
  const lines = (await api.v1.sketch.rectangle({ id: skId, startPos: [60, 0, 0], endPos: [100, 40, 0] })).result
  console.log(`[bool-deep] lines for dimension test: ${JSON.stringify(lines)}`)

  return {}
}
