// Test: updateGeometry with a line ID passed in the circles array (type mismatch)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line and a circle
  const geo = await api.v1.sketch.geometry({
    id: skId,
    lines: [{ startPos: [0, 0, 0], endPos: [50, 0, 0] }],
    circles: [{ centerPos: [25, 25, 0], radius: 15 }],
    genFixation: false,
  })
  const lineId = geo.result.lines[0]
  const circId = geo.result.circles[0]
  console.log('[08] created — line:', lineId, 'circle:', circId)

  // Pass line ID in circles array
  const r1 = await api.v1.sketch.updateGeometry({
    id: skId,
    circles: [{ id: lineId, centerPos: [50, 50, 0], radius: 20 }],
  })
  console.log('[08] line-as-circle result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[08] line-as-circle messages:', JSON.stringify(r1.messages))

  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'wrong-type-response')

  // Pass circle ID in lines array
  const r2 = await api.v1.sketch.updateGeometry({
    id: skId,
    lines: [{ id: circId, startPos: [10, 10, 0], endPos: [80, 80, 0] }],
  })
  console.log('[08] circle-as-line result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[08] circle-as-line messages:', JSON.stringify(r2.messages))

  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'wrong-type-response2')

  await snapshot('after')

  return { partId }
}
