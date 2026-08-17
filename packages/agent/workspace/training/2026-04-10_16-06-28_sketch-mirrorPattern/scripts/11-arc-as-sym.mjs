// Edge case: arc as symmetryLineId — does it only accept sketch-line?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [5, 5, 0], endPos: [15, 5, 0] })).result
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1] })).result

  // Create an arc and try using it as symmetry line
  const arc = (await api.v1.sketch.arcBy3Points({ id: skId, startPos: [30, 0, 0], endPos: [30, 30, 0], midPos: [35, 15, 0] })).result
  console.log('[11] arc:', arc)

  const r = await api.v1.sketch.mirrorPattern({ id: skId, rigidSetId: rsId, symmetryLineId: arc })
  console.log('[11] result:', JSON.stringify(r.result))
  console.log('[11] maxLevel:', r.maxLevel)
  console.log('[11] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'arc-as-sym')

  return { partId }
}
