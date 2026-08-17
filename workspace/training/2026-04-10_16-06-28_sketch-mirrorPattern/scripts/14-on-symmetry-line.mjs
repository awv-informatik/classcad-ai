// Edge case: geometry ON the symmetry line — does it duplicate or collapse?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a circle centered ON the symmetry line
  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [30, 15, 0], radius: 10 })).result
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [circle] })).result

  // Symmetry line at x=30 — passes through the circle's center
  const symLine = (await api.v1.sketch.line({ id: skId, startPos: [30, -10, 0], endPos: [30, 40, 0] })).result

  const r = await api.v1.sketch.mirrorPattern({ id: skId, rigidSetId: rsId, symmetryLineId: symLine })
  console.log('[14] result:', JSON.stringify(r.result))
  console.log('[14] maxLevel:', r.maxLevel)
  console.log('[14] geometry length:', r.result?.geometry?.length)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'on-symmetry')

  await snapshot('on-symmetry')
  return { partId }
}
