// 09 — Move geometry that has constraints
// Does moveGeometry interact with the constraint solver?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two lines with auto-constraints
  const geo = await api.v1.sketch.geometry({
    id: skId,
    lines: [
      { startPos: [0, 0, 0], endPos: [40, 0, 0] },
      { startPos: [40, 0, 0], endPos: [40, 30, 0] },
    ],
    genFixation: false,
  })
  const [line1, line2] = geo.result.lines
  console.log('[09] line1:', line1, 'line2:', line2)

  // Add coincidence constraint between endpoints
  const pts1 = (await api.v1.sketch.getPoints({ id: line1 })).result
  const pts2 = (await api.v1.sketch.getPoints({ id: line2 })).result
  console.log('[09] line1 pts:', JSON.stringify(pts1))
  console.log('[09] line2 pts:', JSON.stringify(pts2))

  // Generate auto-constraints (should detect coincidence)
  const autoR = await api.v1.sketch.generateAutoConstraints({ id: skId })
  console.log('[09] autoConstraints result:', autoR.result, 'maxLevel:', autoR.maxLevel)

  // Get positions before
  const line1Before = (await api.v1.sketch.getPositions({ id: line1 })).result
  const line2Before = (await api.v1.sketch.getPositions({ id: line2 })).result
  console.log('[09] line1 before:', JSON.stringify(line1Before))
  console.log('[09] line2 before:', JSON.stringify(line2Before))

  await snapshot('before')

  // Move only line1 — does line2 follow due to coincidence constraint?
  const r = await api.v1.sketch.moveGeometry({ id: skId, geomIds: [line1], translation: [10, 10, 0] })
  console.log('[09] moveGeometry result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[09] messages:', JSON.stringify(r.messages))

  const line1After = (await api.v1.sketch.getPositions({ id: line1 })).result
  const line2After = (await api.v1.sketch.getPositions({ id: line2 })).result
  console.log('[09] line1 after:', JSON.stringify(line1After))
  console.log('[09] line2 after:', JSON.stringify(line2After))

  filewrite({
    line1Before, line2Before,
    line1After, line2After,
    moveResult: r.result,
    maxLevel: r.maxLevel,
    messages: r.messages,
  }, 'constrained-move-result')

  await snapshot('after')

  return { partId }
}
