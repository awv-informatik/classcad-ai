export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceNoRef' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 60, width: 40, height: 50 })).result

  // Slice without providing reference — docs say default is XY plane
  const sliceR = await api.v1.part.slice({
    id: partId,
    targets: [{ id: boxId }],
  })
  console.log('[11] no reference - sliceId:', sliceR.result, 'maxLevel:', sliceR.maxLevel)
  filewrite({ result: sliceR.result, messages: sliceR.messages, maxLevel: sliceR.maxLevel }, 'no-ref-response')

  if (sliceR.result) await snapshot('no-ref')

  return { partId, sliceId: sliceR.result }
}
