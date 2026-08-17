// Test edge cases: negative distance, zero distance, count=1
export default async function (api, { snapshot, filewrite }) {
  // Test 1: negative xDistance
  {
    const partId = (await api.v1.part.create({ name: 'NegDistTest' })).result
    const skId = (await api.v1.sketch.create({ id: partId })).result
    const l1 = (await api.v1.sketch.line({ id: skId, startPos: [50, 0, 0], endPos: [60, 10, 0] })).result
    const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1] })).result
    const r = await api.v1.sketch.linearPattern({
      id: skId, rigidSetId: rsId,
      xCount: 3, xDistance: -20,
    })
    console.log('[04a] negative xDistance: maxLevel:', r.maxLevel, 'geometry count:', r.result?.geometry?.length)
    filewrite(r.result, 'negative-dist-result')
    await snapshot('negative-dist')
  }

  // Test 2: zero xDistance
  {
    const partId = (await api.v1.part.create({ name: 'ZeroDistTest' })).result
    const skId = (await api.v1.sketch.create({ id: partId })).result
    const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [10, 10, 0] })).result
    const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1] })).result
    const r = await api.v1.sketch.linearPattern({
      id: skId, rigidSetId: rsId,
      xCount: 3, xDistance: 0,
    })
    console.log('[04b] zero xDistance: maxLevel:', r.maxLevel, 'geometry count:', r.result?.geometry?.length)
    filewrite(r.result, 'zero-dist-result')
    await snapshot('zero-dist')
  }

  // Test 3: xCount=1, yCount=1 (no copies)
  {
    const partId = (await api.v1.part.create({ name: 'Count1Test' })).result
    const skId = (await api.v1.sketch.create({ id: partId })).result
    const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [10, 10, 0] })).result
    const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1] })).result
    const r = await api.v1.sketch.linearPattern({
      id: skId, rigidSetId: rsId,
      xCount: 1, yCount: 1,
    })
    console.log('[04c] count=1,1: maxLevel:', r.maxLevel, 'result:', r.result)
    filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'count1-full')
  }

  // Test 4: only defaults (no count/distance specified at all)
  {
    const partId = (await api.v1.part.create({ name: 'DefaultsTest' })).result
    const skId = (await api.v1.sketch.create({ id: partId })).result
    const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [10, 10, 0] })).result
    const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1] })).result
    const r = await api.v1.sketch.linearPattern({
      id: skId, rigidSetId: rsId,
    })
    console.log('[04d] no params: maxLevel:', r.maxLevel, 'result:', r.result)
    filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'defaults-full')
  }

  return {}
}
