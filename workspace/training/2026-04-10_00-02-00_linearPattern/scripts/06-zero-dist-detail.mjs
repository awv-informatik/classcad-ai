// Test zero distance with full error capture
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ZeroDistDetail' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [10, 10, 0] })).result
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1] })).result

  // Test zero xDistance with xCount > 1
  const r1 = await api.v1.sketch.linearPattern({
    id: skId, rigidSetId: rsId,
    xCount: 3, xDistance: 0,
  })
  console.log('[06a] zero xDist, xCount=3: maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'zero-xdist-full')

  // Test zero yDistance with yCount > 1
  const partId2 = (await api.v1.part.create({ name: 'ZeroDistDetail2' })).result
  const skId2 = (await api.v1.sketch.create({ id: partId2 })).result
  const l2 = (await api.v1.sketch.line({ id: skId2, startPos: [0, 0, 0], endPos: [10, 10, 0] })).result
  const rsId2 = (await api.v1.sketch.rigidSet({ id: skId2, geomIds: [l2] })).result

  const r2 = await api.v1.sketch.linearPattern({
    id: skId2, rigidSetId: rsId2,
    yCount: 3, yDistance: 0,
  })
  console.log('[06b] zero yDist, yCount=3: maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'zero-ydist-full')

  // Test zero distance but also non-zero other axis
  const partId3 = (await api.v1.part.create({ name: 'ZeroDistMixed' })).result
  const skId3 = (await api.v1.sketch.create({ id: partId3 })).result
  const l3 = (await api.v1.sketch.line({ id: skId3, startPos: [0, 0, 0], endPos: [10, 10, 0] })).result
  const rsId3 = (await api.v1.sketch.rigidSet({ id: skId3, geomIds: [l3] })).result

  const r3 = await api.v1.sketch.linearPattern({
    id: skId3, rigidSetId: rsId3,
    xCount: 3, xDistance: 0, yCount: 2, yDistance: 25,
  })
  console.log('[06c] zero xDist + valid yDist: maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'zero-mixed-full')

  if (r3.maxLevel <= 31) {
    await snapshot('zero-mixed')
  }

  return {}
}
