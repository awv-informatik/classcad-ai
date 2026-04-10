// Test: arcsByCenter isClockwise flag during update
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create arc counterclockwise
  const geo = await api.v1.sketch.geometry({
    id: skId,
    arcsByCenter: [{
      startPos: [40, 0, 0],
      endPos: [0, 40, 0],
      centerPos: [0, 0, 0],
      isClockwise: false,
    }],
    genFixation: false,
  })
  const arcId = geo.result.arcsByCenter[0]
  console.log('[15] created arc:', arcId)

  await snapshot('before-ccw')

  // Update to clockwise (same positions, flip direction)
  const r = await api.v1.sketch.updateGeometry({
    id: skId,
    arcsByCenter: [{
      id: arcId,
      startPos: [40, 0, 0],
      endPos: [0, 40, 0],
      centerPos: [0, 0, 0],
      isClockwise: true,
    }],
  })
  console.log('[15] flip to CW result:', r.result, 'maxLevel:', r.maxLevel)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'clockwise-toggle')

  await snapshot('after-cw')

  return { partId }
}
