export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceRef' })).result

  // Main box: z from -30 to +30 (straddles XY plane)
  const boxId = (await api.v1.part.box({ id: partId, name: 'TallBox', length: 60, width: 40, height: 60, translation: [0, 0, -30] })).result

  // Reference body that won't be sliced (small sphere off to the side)
  const refId = (await api.v1.part.sphere({ id: partId, name: 'Ref', diameter: 20, translation: [80, 0, 0] })).result

  await snapshot('before')

  // Get graphic data before slice
  const gBefore = (await api.v1.common.requestVisualisation({}))
  filewrite(gBefore.graphic, 'graphic-before')

  // Slice the box at Top plane (z=0), inverted=FALSE (keep +Z side)
  const topWpId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const sliceR = await api.v1.part.slice({
    id: partId,
    name: 'MySlice',
    targets: [{ id: boxId }],
    reference: topWpId,
  })
  console.log('[02] slice result:', sliceR.result, 'maxLevel:', sliceR.maxLevel)
  filewrite({ result: sliceR.result, messages: sliceR.messages, maxLevel: sliceR.maxLevel }, 'slice-response')

  await snapshot('after')

  // Get graphic data after slice
  const gAfter = (await api.v1.common.requestVisualisation({}))
  filewrite(gAfter.graphic, 'graphic-after')

  return { partId, boxId, refId, sliceId: sliceR.result }
}
