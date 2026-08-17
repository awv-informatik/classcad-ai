// Test: Split at negative value
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitNeg' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result

  const r = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: lineId, values: [-0.5] }]
  })
  console.log('[14] split at -0.5 — result:', JSON.stringify(r.result), 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[14] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'split-neg')

  return { partId }
}
