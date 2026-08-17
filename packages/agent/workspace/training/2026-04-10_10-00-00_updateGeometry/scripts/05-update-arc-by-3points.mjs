// Test: updateGeometry with arcsBy3Points — update arc by 3 positions
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create an arc by 3 points
  const geo = await api.v1.sketch.geometry({
    id: skId,
    arcsBy3Points: [{
      startPos: [0, 0, 0],
      endPos: [40, 0, 0],
      midPos: [20, 20, 0],
    }],
    genFixation: false,
  })
  const [arcId] = geo.result.arcsBy3Points
  console.log('[05] created arcBy3Points:', arcId)

  await snapshot('before')

  // Update: change all 3 positions
  const r = await api.v1.sketch.updateGeometry({
    id: skId,
    arcsBy3Points: [{
      id: arcId,
      startPos: [0, 0, 0],
      endPos: [80, 0, 0],
      midPos: [40, 40, 0],
    }],
  })
  console.log('[05] updateGeometry result:', r.result)
  console.log('[05] maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-arc-3pts-response')

  await snapshot('after')

  return { partId }
}
