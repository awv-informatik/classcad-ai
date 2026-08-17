// Test count edge cases: 0, 1, negative, fractional
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [20, 0, 0], endPos: [40, 0, 0] })).result
  const centerPt = (await api.v1.sketch.point({ id: skId, pos: [0, 0, 0] })).result
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1] })).result

  // count=1 — just the original, no copies
  const r1 = await api.v1.sketch.circularPattern({
    id: skId, rigidSetId: rsId, centerId: centerPt, angle: Math.PI / 2, count: 1,
  })
  console.log('[02] count=1 maxLevel:', r1.maxLevel, 'result:', r1.result)
  console.log('[02] count=1 geometry:', r1.result?.geometry)

  // Need fresh setup for each test since we can't reuse the same rigid set easily
  const partId2 = (await api.v1.part.create({ name: 'Test2' })).result
  const skId2 = (await api.v1.sketch.create({ id: partId2 })).result
  const l2 = (await api.v1.sketch.line({ id: skId2, startPos: [20, 0, 0], endPos: [40, 0, 0] })).result
  const cp2 = (await api.v1.sketch.point({ id: skId2, pos: [0, 0, 0] })).result
  const rs2 = (await api.v1.sketch.rigidSet({ id: skId2, geomIds: [l2] })).result

  // count=0
  const r2 = await api.v1.sketch.circularPattern({
    id: skId2, rigidSetId: rs2, centerId: cp2, angle: Math.PI / 2, count: 0,
  })
  console.log('[02] count=0 maxLevel:', r2.maxLevel, 'result:', r2.result)

  // Fresh for count=-1
  const partId3 = (await api.v1.part.create({ name: 'Test3' })).result
  const skId3 = (await api.v1.sketch.create({ id: partId3 })).result
  const l3 = (await api.v1.sketch.line({ id: skId3, startPos: [20, 0, 0], endPos: [40, 0, 0] })).result
  const cp3 = (await api.v1.sketch.point({ id: skId3, pos: [0, 0, 0] })).result
  const rs3 = (await api.v1.sketch.rigidSet({ id: skId3, geomIds: [l3] })).result

  // count=-1
  const r3 = await api.v1.sketch.circularPattern({
    id: skId3, rigidSetId: rs3, centerId: cp3, angle: Math.PI / 2, count: -1,
  })
  console.log('[02] count=-1 maxLevel:', r3.maxLevel, 'result:', r3.result)

  // Fresh for fractional count
  const partId4 = (await api.v1.part.create({ name: 'Test4' })).result
  const skId4 = (await api.v1.sketch.create({ id: partId4 })).result
  const l4 = (await api.v1.sketch.line({ id: skId4, startPos: [20, 0, 0], endPos: [40, 0, 0] })).result
  const cp4 = (await api.v1.sketch.point({ id: skId4, pos: [0, 0, 0] })).result
  const rs4 = (await api.v1.sketch.rigidSet({ id: skId4, geomIds: [l4] })).result

  // count=3.7 (fractional)
  const r4 = await api.v1.sketch.circularPattern({
    id: skId4, rigidSetId: rs4, centerId: cp4, angle: Math.PI / 4, count: 3.7,
  })
  console.log('[02] count=3.7 maxLevel:', r4.maxLevel, 'geometry count:', r4.result?.geometry?.length)

  filewrite({
    count1: { maxLevel: r1.maxLevel, result: r1.result, messages: r1.messages },
    count0: { maxLevel: r2.maxLevel, result: r2.result, messages: r2.messages },
    countNeg1: { maxLevel: r3.maxLevel, result: r3.result, messages: r3.messages },
    countFrac: { maxLevel: r4.maxLevel, result: r4.result, messages: r4.messages },
  }, 'count-edge-cases')

  return { partId }
}
