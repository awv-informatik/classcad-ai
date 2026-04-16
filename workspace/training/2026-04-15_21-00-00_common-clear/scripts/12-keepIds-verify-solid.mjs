// 12 — keepIds: verify solid survival by trying different operations
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VerifySolid' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[12] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Keep everything
  await api.v1.common.clear({ keepIds: [partId, eifId, boxId] })
  console.log('[12] cleared with keepIds=[partId,eifId,boxId]')

  // Try translation instead of copy
  const transR = await api.v1.solid.translation({ id: eifId, target: boxId, translation: [20, 0, 0] })
  console.log('[12] translation — result:', transR.result, 'maxLevel:', transR.maxLevel)

  // Try creating new geometry in the kept eif
  const newBox = await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30, translation: [0, 80, 0] })
  console.log('[12] new box in kept eif — result:', newBox.result, 'maxLevel:', newBox.maxLevel)

  if (newBox.result) {
    await snapshot('after-keep-with-newbox')
  }

  return { partId }
}
