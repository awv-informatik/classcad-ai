// Test: Split at 0.0 — does it work?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitAtZero' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result

  const r = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: lineId, values: [0.0] }]
  })
  console.log('[19] split at 0.0 — result:', JSON.stringify(r.result), 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[19] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'split-at-0')

  // Get positions of segments
  if (r.result) {
    for (const segId of r.result[0]) {
      const pos = await api.v1.sketch.getPositions({ id: segId })
      console.log(`[19] seg ${segId}: positions=${JSON.stringify(pos.result)}`)
    }
  }

  return { partId }
}
