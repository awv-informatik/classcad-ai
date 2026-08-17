// Test: Verify whether updating geometry with wrong sketch ID actually moves it
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skA = (await api.v1.sketch.create({ id: partId })).result
  const skB = (await api.v1.sketch.create({ id: partId })).result

  // Create a line in sketch A
  const geo = await api.v1.sketch.geometry({
    id: skA,
    lines: [{ startPos: [0, 0, 0], endPos: [50, 50, 0] }],
    genFixation: false,
    genVertAndHoriz: false,
  })
  const lineId = geo.result.lines[0]
  console.log('[17] created line in skA:', lineId)

  // Check position before
  const posBefore = await api.v1.sketch.getPositions({ id: lineId })
  console.log('[17] pos before:', JSON.stringify(posBefore.result))

  // Update using skB's ID
  const r = await api.v1.sketch.updateGeometry({
    id: skB,
    lines: [{ id: lineId, startPos: [10, 10, 0], endPos: [80, 80, 0] }],
  })
  console.log('[17] wrong sketch update result:', r.result, 'maxLevel:', r.maxLevel)

  // Check position after
  const posAfter = await api.v1.sketch.getPositions({ id: lineId })
  console.log('[17] pos after:', JSON.stringify(posAfter.result))

  const moved = JSON.stringify(posBefore.result) !== JSON.stringify(posAfter.result)
  console.log('[17] DID THE LINE ACTUALLY MOVE?', moved)

  filewrite({ posBefore: posBefore.result, posAfter: posAfter.result, moved }, 'wrong-sketch-verify')

  return { partId }
}
