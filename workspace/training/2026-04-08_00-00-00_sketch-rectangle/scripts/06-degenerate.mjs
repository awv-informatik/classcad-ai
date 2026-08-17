// 06 — edge cases: zero-size rect, negative coords, very large rect
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Zero-size rectangle (startPos == endPos)
  const r1 = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [0, 0, 0],
  })
  console.log('[06] zero-size result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[06] zero-size messages:', JSON.stringify(r1.messages))

  // Zero width (same X)
  const r2 = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [10, 0, 0],
    endPos: [10, 30, 0],
  })
  console.log('[06] zero-width result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Zero height (same Y)
  const r3 = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [20, 10, 0],
    endPos: [60, 10, 0],
  })
  console.log('[06] zero-height result:', r3.result, 'maxLevel:', r3.maxLevel)

  // Negative coordinates
  const r4 = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [-30, -20, 0],
    endPos: [-10, -5, 0],
  })
  console.log('[06] negative coords result:', r4.result, 'maxLevel:', r4.maxLevel)

  // endPos "before" startPos (swapped corners)
  const r5 = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [80, 60, 0],
    endPos: [40, 30, 0],
  })
  console.log('[06] swapped corners result:', r5.result, 'maxLevel:', r5.maxLevel)

  // Get positions for swapped case to verify orientation
  if (r5.result) {
    for (let i = 0; i < r5.result.length; i++) {
      const pos = await api.v1.sketch.getPositions({ id: r5.result[i] })
      console.log(`[06] swapped line[${i}]:`, JSON.stringify(pos.result))
    }
  }

  filewrite({
    zeroSize: { result: r1.result, maxLevel: r1.maxLevel },
    zeroWidth: { result: r2.result, maxLevel: r2.maxLevel },
    zeroHeight: { result: r3.result, maxLevel: r3.maxLevel },
    negativeCoords: { result: r4.result, maxLevel: r4.maxLevel },
    swappedCorners: { result: r5.result, maxLevel: r5.maxLevel },
  }, 'edge-cases')

  await snapshot('edge-cases')
  return { partId }
}
