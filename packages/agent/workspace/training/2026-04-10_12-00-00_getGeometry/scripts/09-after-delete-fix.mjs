// Test getGeometry after deleting geometry (correct deleteObject call with `ids` array)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const geo = await api.v1.sketch.geometry({
    id: skId,
    lines: [
      { startPos: [0, 0, 0], endPos: [50, 0, 0] },
      { startPos: [50, 0, 0], endPos: [50, 30, 0] },
    ],
    circles: [{ centerPos: [25, 15, 0], radius: 8 }],
    genFixation: false,
  })

  const before = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[09] before delete:', JSON.stringify(before.result))

  // Delete the circle using correct `ids` param (array)
  const circId = geo.result.circles[0]
  const delR = await api.v1.sketch.deleteObject({ ids: [circId] })
  console.log('[09] delete maxLevel:', delR.maxLevel)

  const after = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[09] after delete:', JSON.stringify(after.result))

  filewrite({
    before: before.result,
    after: after.result,
    circleRemoved: !after.result.circles?.includes(circId),
    deletedId: circId,
  }, 'delete-fixed')

  return { partId, skId }
}
