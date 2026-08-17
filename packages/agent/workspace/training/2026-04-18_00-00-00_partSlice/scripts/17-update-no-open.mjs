export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateNoOpen' })).result

  const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 60, width: 40, height: 50 })).result
  const topWpId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const sliceId = (await api.v1.part.slice({
    id: partId,
    targets: [{ id: boxId }],
    reference: topWpId,
  })).result

  // Try to update WITHOUT openFeature — should this fail?
  const updateR = await api.v1.part.updateSlice({
    id: sliceId,
    inverted: 1,
  })
  console.log('[17] update without open - result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'no-open-response')

  return { partId, sliceId }
}
