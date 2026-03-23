// Q: Do sketch elements (lines, circles, constraints) have their own IDs? How do they flow?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const sketchId = (await api.v1.sketch.create({ id: partId })).result
  console.log('[17] partId:', partId, 'sketchId:', sketchId)

  // Draw a line in the sketch
  const lineR = await api.v1.sketch.line({ id: sketchId, startPos: [0, 0, 0], endPos: [100, 0, 0] })
  console.log('[17] line result:', lineR.result, 'type:', typeof lineR.result, 'isArray:', Array.isArray(lineR.result))

  // Draw a circle
  const circR = await api.v1.sketch.circle({ id: sketchId, centerPos: [50, 50, 0], radius: 25 })
  console.log('[17] circle result:', circR.result, 'type:', typeof circR.result)

  // Draw a rectangle — returns Array<id>
  const rectR = await api.v1.sketch.rectangle({ id: sketchId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  console.log('[17] rectangle result:', JSON.stringify(rectR.result), 'type:', typeof rectR.result, 'isArray:', Array.isArray(rectR.result))

  // Can we use a sketch element ID in common.setObjectName?
  if (typeof lineR.result === 'number') {
    const r1 = await api.v1.common.setObjectName({ id: lineR.result, name: 'MyLine' })
    console.log('[17] setObjectName on lineId:', r1.maxLevel <= 31 ? '✓' : '❌')
  }

  // Can we use sketch element IDs in sketch constraint APIs?
  if (Array.isArray(rectR.result) && rectR.result.length > 0) {
    console.log('[17] rect element IDs:', rectR.result)
    // These IDs are used for constraints
  }
}
