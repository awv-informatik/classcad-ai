// Mirror a rigid set containing mixed geometry types: line + circle + arc
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create mixed geometry on the left side
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [5, 0, 0], endPos: [5, 20, 0] })).result
  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [10, 25, 0], radius: 4 })).result
  const arc1 = (await api.v1.sketch.arcBy3Points({ id: skId, startPos: [5, 20, 0], midPos: [10, 30, 0], endPos: [15, 20, 0] })).result

  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, c1, arc1] })).result
  console.log('[15] rigidSet:', rsId)

  // Vertical symmetry line at x=30
  const symLine = (await api.v1.sketch.line({ id: skId, startPos: [30, -10, 0], endPos: [30, 40, 0] })).result

  const r = await api.v1.sketch.mirrorPattern({ id: skId, rigidSetId: rsId, symmetryLineId: symLine })
  console.log('[15] result:', JSON.stringify(r.result))
  console.log('[15] maxLevel:', r.maxLevel)
  console.log('[15] geometry length:', r.result?.geometry?.length)

  filewrite({ result: r.result, maxLevel: r.maxLevel }, 'mixed-geometry')

  await snapshot('mixed-geometry')
  return { partId }
}
