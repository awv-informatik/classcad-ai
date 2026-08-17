// Test error cases: invalid ID, wrong ID type, missing params
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'ErrorCases' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

  const pts = (await api.v1.sketch.getPoints({ id: rectIds[0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.startId] })

  const dimId = (await api.v1.sketch.dimension({ id: skId, name: 'width', type: 'OFFSET', geomIds: [rectIds[0]] })).result

  const results = {}

  // Test 1: wrong ID type — pass sketch ID instead of dimension ID
  const u1 = await api.v1.sketch.updateDimension({ id: skId, value: 100 })
  results.wrongIdType = { result: u1.result, maxLevel: u1.maxLevel, messages: u1.messages }
  console.log('[06] wrong ID type (sketch):', u1.result, u1.maxLevel, JSON.stringify(u1.messages))

  // Test 2: wrong ID type — pass line ID
  const u2 = await api.v1.sketch.updateDimension({ id: rectIds[0], value: 100 })
  results.lineId = { result: u2.result, maxLevel: u2.maxLevel, messages: u2.messages }
  console.log('[06] wrong ID type (line):', u2.result, u2.maxLevel, JSON.stringify(u2.messages))

  // Test 3: invalid/nonexistent ID
  const u3 = await api.v1.sketch.updateDimension({ id: 99999, value: 100 })
  results.invalidId = { result: u3.result, maxLevel: u3.maxLevel, messages: u3.messages }
  console.log('[06] invalid ID:', u3.result, u3.maxLevel, JSON.stringify(u3.messages))

  // Test 4: missing value param
  const u4 = await api.v1.sketch.updateDimension({ id: dimId })
  results.missingValue = { result: u4.result, maxLevel: u4.maxLevel, messages: u4.messages }
  console.log('[06] missing value:', u4.result, u4.maxLevel, JSON.stringify(u4.messages))

  // Test 5: missing id param
  const u5 = await api.v1.sketch.updateDimension({ value: 100 })
  results.missingId = { result: u5.result, maxLevel: u5.maxLevel, messages: u5.messages }
  console.log('[06] missing id:', u5.result, u5.maxLevel, JSON.stringify(u5.messages))

  // Test 6: pass constraint ID instead of dimension ID
  const cId = (await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [rectIds[0]] })).result
  const u6 = await api.v1.sketch.updateDimension({ id: cId, value: 100 })
  results.constraintId = { result: u6.result, maxLevel: u6.maxLevel, messages: u6.messages }
  console.log('[06] constraint ID:', u6.result, u6.maxLevel, JSON.stringify(u6.messages))

  filewrite(results, 'error-cases-data')
  return { partId }
}
