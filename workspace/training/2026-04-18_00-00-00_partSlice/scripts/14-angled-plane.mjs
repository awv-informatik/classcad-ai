export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceAngled' })).result

  const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 50 })).result
  const refId = (await api.v1.part.cylinder({ id: partId, name: 'Ref', diameter: 10, height: 15, translation: [100, 30, 0] })).result

  await snapshot('before')

  // Angled work plane: normal at 45° between Z and X
  const wpId = (await api.v1.part.workPlane({
    id: partId,
    name: 'AngledPlane',
    origin: [40, 30, 25],
    normal: [1, 0, 1], // 45° between X and Z
    xDirection: [0, 1, 0],
  })).result

  const sliceR = await api.v1.part.slice({
    id: partId,
    targets: [{ id: boxId }],
    reference: wpId,
  })
  console.log('[14] angled plane - sliceId:', sliceR.result, 'maxLevel:', sliceR.maxLevel)
  filewrite({ result: sliceR.result, messages: sliceR.messages, maxLevel: sliceR.maxLevel }, 'angled-response')

  await snapshot('after-angled')

  return { partId, sliceId: sliceR.result }
}
