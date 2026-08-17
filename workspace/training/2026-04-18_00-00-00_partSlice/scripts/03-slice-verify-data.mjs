export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceVerify' })).result

  // Box: 60x40x60, centered at origin (z from -30 to +30)
  const boxR = await api.v1.part.box({ id: partId, name: 'TallBox', length: 60, width: 40, height: 60, translation: [0, 0, -30] })
  const boxId = boxR.result
  console.log('[03] boxId:', boxId)

  // Small reference cylinder off to the side (for snapshot comparison)
  const refR = await api.v1.part.cylinder({ id: partId, name: 'Ref', diameter: 10, height: 15, translation: [80, 20, 0] })
  console.log('[03] refId:', refR.result)

  // Capture graphic data before slice
  filewrite(boxR.graphic, 'graphic-box')

  await snapshot('before')

  // Slice at Top plane (z=0), inverted=FALSE → keep +Z side (z=0 to z=+30)
  const topWpId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const sliceR = await api.v1.part.slice({
    id: partId,
    targets: [{ id: boxId }],
    reference: topWpId,
  })
  const sliceId = sliceR.result
  console.log('[03] sliceId:', sliceId, 'maxLevel:', sliceR.maxLevel)

  // Capture graphic data after slice
  filewrite(sliceR.graphic, 'graphic-after-slice')

  await snapshot('after')

  // Use getExpression to check box height parameter
  const heightR = await api.v1.part.getExpression({ id: partId, name: 'TallBox.height' })
  console.log('[03] box height expression:', JSON.stringify(heightR.result))
  const heightR2 = await api.v1.part.getExpression({ id: partId, name: 'MySlice.height' })
  console.log('[03] slice height expression:', JSON.stringify(heightR2.result))

  // Check if box feature is consumed
  const boxCheck = await api.v1.part.getExpression({ id: partId, name: 'TallBox.length' })
  console.log('[03] box length (check consumed):', JSON.stringify(boxCheck.result), 'maxLevel:', boxCheck.maxLevel)

  return { partId, boxId, sliceId }
}
