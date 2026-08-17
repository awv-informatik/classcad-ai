// Test: can you mix sketch element IDs from different sketches?
// Also: what about sketch elements from a sketch that's on a different plane?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CrossSketchTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Sketch 1: draw two sides of a rectangle (bottom + right)
  const sk1 = (await api.v1.sketch.create({ id: partId })).result
  const l1 = (await api.v1.sketch.line({ id: sk1, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: sk1, startPos: [50, 0, 0], endPos: [50, 30, 0] })).result

  // Sketch 2: draw the other two sides (top + left)
  const sk2 = (await api.v1.sketch.create({ id: partId })).result
  const l3 = (await api.v1.sketch.line({ id: sk2, startPos: [50, 30, 0], endPos: [0, 30, 0] })).result
  const l4 = (await api.v1.sketch.line({ id: sk2, startPos: [0, 30, 0], endPos: [0, 0, 0] })).result

  console.log('[10] sk1 lines:', l1, l2, '  sk2 lines:', l3, l4)

  // Mix IDs from both sketches
  const extResult = await api.v1.solid.extrusion({
    id: eifId,
    direction: [0, 0, 25],
    curves: [l1, l2, l3, l4],
  })
  console.log('[10] mixed sketch result:', extResult.result, 'maxLevel:', extResult.maxLevel)
  if (extResult.messages?.length) {
    console.log('[10] messages:', JSON.stringify(extResult.messages.map(m => m.message)))
  }

  filewrite({
    sk1Lines: [l1, l2],
    sk2Lines: [l3, l4],
    result: extResult.result,
    maxLevel: extResult.maxLevel,
    messages: extResult.messages,
  }, 'cross-sketch')

  if (extResult.result) {
    await snapshot('cross-sketch-extrusion')
  }
  return { partId }
}
