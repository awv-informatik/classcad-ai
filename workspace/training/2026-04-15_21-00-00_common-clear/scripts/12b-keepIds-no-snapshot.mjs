// 12b — keepIds: verify solid survival — NO snapshot (avoid recalc hang)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VerifySolid' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[12b] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Keep everything
  await api.v1.common.clear({ keepIds: [partId, eifId, boxId] })
  console.log('[12b] cleared with keepIds=[partId,eifId,boxId]')

  // Try translation on kept box
  const transR = await api.v1.solid.translation({ id: eifId, target: boxId, translation: [20, 0, 0] })
  console.log('[12b] translation — result:', transR.result, 'maxLevel:', transR.maxLevel)
  console.log('[12b] trans messages:', JSON.stringify(transR.messages))

  // Try creating new geometry alongside
  const newBox = await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30, translation: [0, 80, 0] })
  console.log('[12b] new box — result:', newBox.result, 'maxLevel:', newBox.maxLevel)

  return { partId }
}
