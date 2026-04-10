// Test larger count and negative distance direction
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LargeCount' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Small triangle to pattern
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [8, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [8, 0, 0], endPos: [4, 6, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [4, 6, 0], endPos: [0, 0, 0] })).result

  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2, l3] })).result

  // 5x3 grid with negative xDistance
  const r = await api.v1.sketch.linearPattern({
    id: skId,
    rigidSetId: rsId,
    xCount: 5,
    xDistance: -15,
    yCount: 3,
    yDistance: 20,
  })
  console.log('[08] maxLevel:', r.maxLevel)
  console.log('[08] geometry count:', r.result.geometry.length)
  console.log('[08] expected:', 5 * 3, 'actual:', r.result.geometry.length)
  console.log('[08] dimensions:', r.result.dimensions)

  filewrite(r.result, 'large-count-result')

  await snapshot('5x3-neg-xdist')

  return { partId }
}
