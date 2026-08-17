// Test: Unsorted split values — do they need to be in ascending order?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Unsorted' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result

  // Pass values in descending order
  const r = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: lineId, values: [0.75, 0.25, 0.5] }]
  })
  console.log('[16] unsorted values — result:', JSON.stringify(r.result), 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[16] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'unsorted-response')

  return { partId }
}
