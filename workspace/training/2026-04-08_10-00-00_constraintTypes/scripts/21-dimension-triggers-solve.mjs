// Test: updateDimension as solver trigger with a rectangle (well-constrained base)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a rectangle — auto-constraints make it well-defined
  const rect = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0],
  })).result
  // rect = [bottom, right, top, left] lines

  // Add EQUAL_LENGTH between bottom (60) and right (40)
  const rEL = await api.v1.sketch.constraint({
    id: skId, type: 'EQUAL_LENGTH', geomIds: [rect[0], rect[1]],
  })
  console.log('[21] EQUAL_LENGTH result:', rEL.result)

  // Add a dimension on the bottom line
  const rDim = await api.v1.sketch.dimension({
    id: skId, type: 'OFFSET', geomIds: [rect[0]],
  })
  console.log('[21] dimension result:', rDim.result, 'maxLevel:', rDim.maxLevel)
  if (rDim.messages?.length) console.log('[21] dim messages:', JSON.stringify(rDim.messages))

  // OFFSET on a single line might not work. Try HORIZONTAL_DISTANCE or just get the auto-value
  // Let me try a different dimension type
  const rDimHD = await api.v1.sketch.dimension({
    id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [rect[0]],
  })
  console.log('[21] HORIZONTAL_DISTANCE result:', rDimHD.result, 'maxLevel:', rDimHD.maxLevel)
  if (rDimHD.messages?.length) console.log('[21] hd messages:', JSON.stringify(rDimHD.messages))

  // Print positions before
  console.log('[21] BEFORE updateDimension:')
  await printRect(api, rect)

  if (rDimHD.result) {
    // updateDimension: change the width to 50 (from 60)
    const rUD = await api.v1.sketch.updateDimension({
      id: rDimHD.result, value: 50,
    })
    console.log('[21] updateDimension result:', rUD.result, 'maxLevel:', rUD.maxLevel)
    if (rUD.messages?.length) console.log('[21] ud messages:', JSON.stringify(rUD.messages))

    console.log('[21] AFTER updateDimension:')
    await printRect(api, rect)
  }

  filewrite({
    dimResult: rDim.result,
    dimHDResult: rDimHD.result,
  }, 'dim-solver')

  return { partId }
}

async function printRect(api, rect) {
  for (let i = 0; i < rect.length; i++) {
    const pts = (await api.v1.sketch.getPoints({ id: rect[i] })).result
    const s = (await api.v1.sketch.getPositions({ id: pts.startId })).result
    const e = (await api.v1.sketch.getPositions({ id: pts.endId })).result
    console.log(`  rect[${i}] [${s.pos.x},${s.pos.y}] → [${e.pos.x},${e.pos.y}]`)
  }
}
