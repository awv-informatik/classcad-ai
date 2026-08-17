// Test case sensitivity of getSketchRegion name parameter
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0]
  })).result

  const regionId = (await api.v1.sketch.sketchRegion({
    id: skId, geomIds: rectIds, name: 'MyProfile'
  })).result

  // Exact match
  const r1 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'MyProfile' })
  console.log('[04] exact "MyProfile":', r1.result, 'match:', r1.result === regionId)

  // Wrong case
  const r2 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'myprofile' })
  console.log('[04] lowercase "myprofile":', r2.result, 'maxLevel:', r2.maxLevel)

  const r3 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'MYPROFILE' })
  console.log('[04] uppercase "MYPROFILE":', r3.result, 'maxLevel:', r3.maxLevel)

  const r4 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'myProfile' })
  console.log('[04] camel "myProfile":', r4.result, 'maxLevel:', r4.maxLevel)

  filewrite({
    regionId,
    exact: { result: r1.result, found: r1.result === regionId },
    lowercase: { result: r2.result, maxLevel: r2.maxLevel },
    uppercase: { result: r3.result, maxLevel: r3.maxLevel },
    camel: { result: r4.result, maxLevel: r4.maxLevel },
  }, 'case-sensitivity')

  return { partId }
}
