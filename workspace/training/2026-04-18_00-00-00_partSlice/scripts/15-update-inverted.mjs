export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateInv' })).result

  const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 60, width: 40, height: 60 })).result
  const refId = (await api.v1.part.cylinder({ id: partId, name: 'Ref', diameter: 10, height: 15, translation: [80, 20, 0] })).result

  const wpId = (await api.v1.part.workPlane({
    id: partId,
    name: 'MidPlane',
    origin: [0, 0, 30],
    normal: [0, 0, 1],
    xDirection: [1, 0, 0],
  })).result

  // Create slice with inverted=FALSE (keep top half)
  const sliceId = (await api.v1.part.slice({
    id: partId,
    targets: [{ id: boxId }],
    reference: wpId,
    inverted: 0,
  })).result
  console.log('[15] sliceId:', sliceId)

  await snapshot('before-update')

  // Update: flip inverted to TRUE (keep bottom half instead)
  await api.v1.part.openFeature({ id: sliceId })
  const updateR = await api.v1.part.updateSlice({
    id: sliceId,
    inverted: 1,
  })
  await api.v1.part.closeFeature({ id: sliceId })
  console.log('[15] update result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'update-inv-response')

  await snapshot('after-update-inv')

  return { partId, sliceId }
}
