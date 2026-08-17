export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateRef' })).result

  const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 50, height: 60 })).result
  const refId = (await api.v1.part.cylinder({ id: partId, name: 'Ref', diameter: 10, height: 15, translation: [100, 25, 0] })).result

  // Two work planes at different heights
  const wp1 = (await api.v1.part.workPlane({ id: partId, name: 'LowPlane', origin: [0, 0, 15], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result
  const wp2 = (await api.v1.part.workPlane({ id: partId, name: 'HighPlane', origin: [0, 0, 45], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result

  // Slice at low plane (keep z=15 to z=60)
  const sliceId = (await api.v1.part.slice({
    id: partId,
    targets: [{ id: boxId }],
    reference: wp1,
  })).result
  console.log('[16] sliceId:', sliceId)

  await snapshot('slice-low')

  // Update: change reference to high plane (keep z=45 to z=60)
  await api.v1.part.openFeature({ id: sliceId })
  const updateR = await api.v1.part.updateSlice({
    id: sliceId,
    reference: wp2,
  })
  await api.v1.part.closeFeature({ id: sliceId })
  console.log('[16] update ref result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'update-ref-response')

  await snapshot('slice-high')

  return { partId, sliceId }
}
