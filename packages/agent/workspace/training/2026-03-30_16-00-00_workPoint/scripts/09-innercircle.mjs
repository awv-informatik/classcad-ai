// Test: INNERCIRCLE — work point at incircle center of 3 curves (triangle)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a sketch with a triangle (3 lines)
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [80, 0, 0], endPos: [40, 60, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [40, 60, 0], endPos: [0, 0, 0] })).result
  console.log('[09] lines:', l1, l2, l3)

  if (l1 && l2 && l3) {
    const r = await api.v1.part.workPoint({
      id: partId, name: 'WP_incircle',
      type: 'INNERCIRCLE',
      references: [l1, l2, l3]
    })
    console.log('[09] INNERCIRCLE result:', r.result, 'maxLevel:', r.maxLevel)
    console.log('[09] messages:', JSON.stringify(r.messages))
    filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'innercircle')
  }

  return { partId }
}
