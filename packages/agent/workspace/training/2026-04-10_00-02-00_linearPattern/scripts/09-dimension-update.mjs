// Test if returned dimension IDs can be updated with sketch.updateDimension
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimUpdate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const c = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 5 })).result
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [c] })).result

  // Create a 3x2 pattern
  const r = await api.v1.sketch.linearPattern({
    id: skId,
    rigidSetId: rsId,
    xCount: 3,
    xDistance: 20,
    yCount: 2,
    yDistance: 30,
  })
  console.log('[09] initial dimensions:', r.result.dimensions)
  const [xDimId, yDimId] = r.result.dimensions

  await snapshot('before-update')

  // Try updating xDistance via dimension ID
  const u1 = await api.v1.sketch.updateDimension({ id: xDimId, value: 40 })
  console.log('[09] updateDimension xDim:', u1.maxLevel, u1.result)

  await snapshot('after-xdist-40')

  // Try updating yDistance via dimension ID
  const u2 = await api.v1.sketch.updateDimension({ id: yDimId, value: 15 })
  console.log('[09] updateDimension yDim:', u2.maxLevel, u2.result)

  await snapshot('after-ydist-15')

  filewrite({ xUpdate: { maxLevel: u1.maxLevel, result: u1.result }, yUpdate: { maxLevel: u2.maxLevel, result: u2.result } }, 'dim-updates')

  return { partId }
}
