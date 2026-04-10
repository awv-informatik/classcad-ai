// Case sensitivity: does part.getSketchRegion match case-insensitively?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0],
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({
    id: skId, geomIds: rectIds, name: 'MyProfile',
  })).result

  const exact = await api.v1.part.getSketchRegion({ id: partId, name: 'MyProfile' })
  const lower = await api.v1.part.getSketchRegion({ id: partId, name: 'myprofile' })
  const upper = await api.v1.part.getSketchRegion({ id: partId, name: 'MYPROFILE' })
  const camel = await api.v1.part.getSketchRegion({ id: partId, name: 'myProfile' })

  console.log('[04] exact:', exact.result, 'maxLevel:', exact.maxLevel)
  console.log('[04] lower:', lower.result, 'maxLevel:', lower.maxLevel)
  console.log('[04] upper:', upper.result, 'maxLevel:', upper.maxLevel)
  console.log('[04] camel:', camel.result, 'maxLevel:', camel.maxLevel)

  filewrite({
    regionId,
    exact: { result: exact.result, maxLevel: exact.maxLevel },
    lower: { result: lower.result, maxLevel: lower.maxLevel },
    upper: { result: upper.result, maxLevel: upper.maxLevel },
    camel: { result: camel.result, maxLevel: camel.maxLevel },
  }, 'case-sensitivity')

  return { partId }
}
