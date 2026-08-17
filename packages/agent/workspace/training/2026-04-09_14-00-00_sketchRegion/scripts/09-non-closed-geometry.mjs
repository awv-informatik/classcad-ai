// Error case: try to create a region from non-closed geometry (single line)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NonClosedTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Single line — not closed
  const line = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 30, 0] })).result

  const r1 = await api.v1.sketch.sketchRegion({ id: skId, geomIds: [line] })
  console.log('[09] single line region result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[09] messages:', JSON.stringify(r1.messages))

  // Two disconnected lines — also not closed
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [10, 10, 0], endPos: [40, 10, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [60, 20, 0], endPos: [80, 40, 0] })).result

  const r2 = await api.v1.sketch.sketchRegion({ id: skId, geomIds: [l2, l3] })
  console.log('[09] disconnected lines result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[09] messages:', JSON.stringify(r2.messages))

  // Three lines forming open U-shape (not closed)
  const u1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 50, 0], endPos: [0, 80, 0] })).result
  const u2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 80, 0], endPos: [30, 80, 0] })).result
  const u3 = (await api.v1.sketch.line({ id: skId, startPos: [30, 80, 0], endPos: [30, 50, 0] })).result

  const r3 = await api.v1.sketch.sketchRegion({ id: skId, geomIds: [u1, u2, u3] })
  console.log('[09] open U result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[09] messages:', JSON.stringify(r3.messages))

  filewrite({
    singleLine: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    disconnected: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    openU: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'non-closed')

  return { partId }
}
