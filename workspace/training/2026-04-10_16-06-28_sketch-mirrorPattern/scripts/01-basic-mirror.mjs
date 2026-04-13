// Basic mirrorPattern: mirror a rigid set (L-shape) across a vertical line
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create an L-shape on the left side
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [20, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [20, 0, 0], endPos: [20, 15, 0] })).result
  console.log('[01] l1:', l1, 'l2:', l2)

  // Create a rigid set from the L-shape
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })).result
  console.log('[01] rigidSet:', rsId)

  // Create a vertical symmetry line at x=40
  const symLine = (await api.v1.sketch.line({ id: skId, startPos: [40, -10, 0], endPos: [40, 30, 0] })).result
  console.log('[01] symmetryLine:', symLine)

  // Mirror
  const r = await api.v1.sketch.mirrorPattern({ id: skId, rigidSetId: rsId, symmetryLineId: symLine })
  console.log('[01] mirrorPattern result:', JSON.stringify(r.result))
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'mirror-response')

  await snapshot('basic-mirror')
  return { partId }
}
