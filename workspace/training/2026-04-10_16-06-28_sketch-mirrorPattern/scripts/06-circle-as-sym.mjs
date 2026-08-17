// Edge case: use a circle (non-line) as symmetryLineId — expect error or unexpected behavior
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Geometry to mirror
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [5, 5, 0], endPos: [15, 5, 0] })).result
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1] })).result

  // Create a circle and try to use it as symmetry line
  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [30, 15, 0], radius: 10 })).result
  console.log('[06] circle:', circle)

  const r = await api.v1.sketch.mirrorPattern({ id: skId, rigidSetId: rsId, symmetryLineId: circle })
  console.log('[06] result:', JSON.stringify(r.result))
  console.log('[06] maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'circle-as-sym')

  await snapshot('circle-as-sym')
  return { partId }
}
