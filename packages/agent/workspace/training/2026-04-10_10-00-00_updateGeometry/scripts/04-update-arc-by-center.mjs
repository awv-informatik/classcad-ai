// Test: updateGeometry with arcsByCenter — update arc positions
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create an arc by center
  const geo = await api.v1.sketch.geometry({
    id: skId,
    arcsByCenter: [{
      startPos: [30, 0, 0],
      endPos: [0, 30, 0],
      centerPos: [0, 0, 0],
      isClockwise: false,
    }],
    genFixation: false,
  })
  const [arcId] = geo.result.arcsByCenter
  console.log('[04] created arcByCenter:', arcId)

  await snapshot('before')

  // Update: move center and endpoints
  const r = await api.v1.sketch.updateGeometry({
    id: skId,
    arcsByCenter: [{
      id: arcId,
      startPos: [60, 0, 0],
      endPos: [0, 60, 0],
      centerPos: [0, 0, 0],
      isClockwise: false,
    }],
  })
  console.log('[04] updateGeometry result:', r.result)
  console.log('[04] maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-arc-center-response')

  await snapshot('after')

  return { partId }
}
