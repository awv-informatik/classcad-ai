// Does adding a dimension trigger the solver? Dimensions set explicit values.
// Test: create a line, add HORIZONTAL constraint, then add an OFFSET dimension
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two lines forming a V shape
  const l1 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [50, 30, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  const l2 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [50, -30, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  // Fix l1
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })

  // HORIZONTAL on l2
  await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [l2] })

  const l2Before = await getLinePositions(api, l2)
  console.log('[19] l2 BEFORE dimension:', l2Before)

  // Add dimension to control l2's length
  const rDim = await api.v1.sketch.dimension({
    id: skId, type: 'OFFSET', geomIds: [l2], value: 40,
  })
  console.log('[19] dimension result:', rDim.result, 'maxLevel:', rDim.maxLevel)
  if (rDim.messages?.length) console.log('[19] dim messages:', JSON.stringify(rDim.messages))

  const l2After = await getLinePositions(api, l2)
  console.log('[19] l2 AFTER dimension:', l2After)

  // Try updateDimension to set a value and trigger solving
  if (rDim.result) {
    const rUD = await api.v1.sketch.updateDimension({
      id: rDim.result, value: 60,
    })
    console.log('[19] updateDimension result:', rUD.result, 'maxLevel:', rUD.maxLevel)

    const l2After2 = await getLinePositions(api, l2)
    console.log('[19] l2 AFTER updateDimension:', l2After2)

    filewrite({
      before: l2Before, afterDimension: l2After, afterUpdateDimension: l2After2,
      dimResult: rDim.result, updateDimResult: rUD.result,
    }, 'dimension-solver')
  }

  return { partId }
}

async function getLinePositions(api, lineId) {
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  const startPos = (await api.v1.sketch.getPositions({ id: pts.startId })).result
  const endPos = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  return { start: startPos, end: endPos }
}
