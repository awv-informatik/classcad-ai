export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateName' })).result

  const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 60, width: 40, height: 50 })).result
  const topWpId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const sliceId = (await api.v1.part.slice({
    id: partId,
    name: 'OriginalName',
    targets: [{ id: boxId }],
    reference: topWpId,
  })).result
  console.log('[18] sliceId:', sliceId)

  // Update the name
  await api.v1.part.openFeature({ id: sliceId })
  const updateR = await api.v1.part.updateSlice({
    id: sliceId,
    name: 'RenamedSlice',
  })
  await api.v1.part.closeFeature({ id: sliceId })
  console.log('[18] rename result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'rename-response')

  // Verify the name change by checking structure
  filewrite(updateR.structure, 'structure-after-rename')

  return { partId, sliceId }
}
