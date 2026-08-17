// Update a standalone point and verify getPositions reflects the change
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const ptId = (await api.v1.sketch.point({ id: skId, pos: [10, 20, 0] })).result

  const before = (await api.v1.sketch.getPositions({ id: ptId })).result
  console.log('[13] before:', JSON.stringify(before))

  const ur = await api.v1.sketch.updateGeometry({ id: ptId, pos: [50, 60, 0] })
  console.log('[13] updateGeometry maxLevel:', ur.maxLevel)

  const after = (await api.v1.sketch.getPositions({ id: ptId })).result
  console.log('[13] after:', JSON.stringify(after))

  const changed = JSON.stringify(before) !== JSON.stringify(after)
  console.log('[13] changed:', changed)

  filewrite({ before, after, changed }, 'point-update')

  return { partId }
}
