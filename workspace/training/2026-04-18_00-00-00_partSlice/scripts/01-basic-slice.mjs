export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceBasic' })).result

  // Create a tall box that straddles the XY plane (z from -30 to +30)
  const boxId = (await api.v1.part.box({ id: partId, name: 'TallBox', length: 60, width: 40, height: 60, translation: [0, 0, -30] })).result
  console.log('[01] boxId:', boxId)

  await snapshot('before')

  // Get the default Top work plane (XY at z=0)
  const topWpId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  console.log('[01] topWpId:', topWpId)

  // Slice at the default top plane with inverted=FALSE (default)
  const sliceR = await api.v1.part.slice({
    id: partId,
    name: 'MySlice',
    targets: [{ id: boxId }],
    reference: topWpId,
  })
  console.log('[01] slice result:', sliceR.result, 'maxLevel:', sliceR.maxLevel)
  filewrite({ result: sliceR.result, messages: sliceR.messages, maxLevel: sliceR.maxLevel }, 'slice-response')

  await snapshot('after')

  // Dump structure to see what's in the feature tree
  filewrite(sliceR.structure, 'structure-after')

  return { partId, boxId, sliceId: sliceR.result }
}
