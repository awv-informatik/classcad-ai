// Test edge cases: negative value, zero, very large, multiple sequential updates
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'EdgeCases' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

  const pts = (await api.v1.sketch.getPoints({ id: rectIds[0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.startId] })

  const dimId = (await api.v1.sketch.dimension({ id: skId, name: 'width', type: 'OFFSET', geomIds: [rectIds[0]] })).result

  const results = {}

  // Test 1: zero value
  const u1 = await api.v1.sketch.updateDimension({ id: dimId, value: 0 })
  const p1 = (await api.v1.sketch.getPositions({ id: rectIds[0] })).result
  results.zero = { result: u1.result, maxLevel: u1.maxLevel, messages: u1.messages, endX: p1.endPos.x }
  console.log('[05] zero: result:', u1.result, 'maxLevel:', u1.maxLevel, 'endX:', p1.endPos.x)

  // Test 2: negative value
  const u2 = await api.v1.sketch.updateDimension({ id: dimId, value: -50 })
  const p2 = (await api.v1.sketch.getPositions({ id: rectIds[0] })).result
  results.negative = { result: u2.result, maxLevel: u2.maxLevel, messages: u2.messages, endX: p2.endPos.x }
  console.log('[05] negative: result:', u2.result, 'maxLevel:', u2.maxLevel, 'endX:', p2.endPos.x)

  // Test 3: very large value
  const u3 = await api.v1.sketch.updateDimension({ id: dimId, value: 999999 })
  const p3 = (await api.v1.sketch.getPositions({ id: rectIds[0] })).result
  results.veryLarge = { result: u3.result, maxLevel: u3.maxLevel, endX: p3.endPos.x }
  console.log('[05] veryLarge: result:', u3.result, 'maxLevel:', u3.maxLevel, 'endX:', p3.endPos.x)

  // Test 4: sequential updates — update multiple times
  const u4a = await api.v1.sketch.updateDimension({ id: dimId, value: 50 })
  const p4a = (await api.v1.sketch.getPositions({ id: rectIds[0] })).result
  const u4b = await api.v1.sketch.updateDimension({ id: dimId, value: 100 })
  const p4b = (await api.v1.sketch.getPositions({ id: rectIds[0] })).result
  const u4c = await api.v1.sketch.updateDimension({ id: dimId, value: 200 })
  const p4c = (await api.v1.sketch.getPositions({ id: rectIds[0] })).result
  results.sequential = {
    step1: { result: u4a.result, endX: p4a.endPos.x },
    step2: { result: u4b.result, endX: p4b.endPos.x },
    step3: { result: u4c.result, endX: p4c.endPos.x },
  }
  console.log('[05] sequential: 50→', p4a.endPos.x, '100→', p4b.endPos.x, '200→', p4c.endPos.x)

  await snapshot('result')

  filewrite(results, 'edge-cases-data')
  return { partId }
}
