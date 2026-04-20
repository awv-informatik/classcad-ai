export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceMulti' })).result

  // Two boxes at different positions, both straddling a cut plane at z=20
  const box1 = (await api.v1.part.box({ id: partId, name: 'Box1', length: 50, width: 30, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Box2', length: 30, width: 50, height: 60, translation: [60, 0, 0] })).result
  const refId = (await api.v1.part.cylinder({ id: partId, name: 'Ref', diameter: 8, height: 10, translation: [30, 60, 0] })).result

  await snapshot('before')

  // Custom plane at z=20
  const wpId = (await api.v1.part.workPlane({
    id: partId,
    name: 'CutAt20',
    origin: [0, 0, 20],
    normal: [0, 0, 1],
    xDirection: [1, 0, 0],
  })).result

  // Slice both boxes at once
  const sliceR = await api.v1.part.slice({
    id: partId,
    targets: [{ id: box1 }, { id: box2 }],
    reference: wpId,
  })
  console.log('[06] sliceId:', sliceR.result, 'maxLevel:', sliceR.maxLevel)
  filewrite({ result: sliceR.result, messages: sliceR.messages, maxLevel: sliceR.maxLevel }, 'multi-targets-response')

  await snapshot('after-multi')

  return { partId, sliceId: sliceR.result }
}
