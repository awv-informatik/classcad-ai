export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceCustomWP' })).result

  // Box: standard position, asymmetric for clear visual
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 50, height: 40 })).result
  const refId = (await api.v1.part.cylinder({ id: partId, name: 'Ref', diameter: 10, height: 15, translation: [100, 25, 0] })).result

  await snapshot('before')

  // Create a custom work plane at z=15 (cutting the box at 3/8 height)
  const wpId = (await api.v1.part.workPlane({
    id: partId,
    name: 'CutPlane',
    origin: [0, 0, 15],
    normal: [0, 0, 1],
    xDirection: [1, 0, 0],
  })).result
  console.log('[05] custom wpId:', wpId)

  // Slice at the custom plane (inverted=FALSE → keep +Z side, z=15 to z=40)
  const sliceR = await api.v1.part.slice({
    id: partId,
    targets: [{ id: boxId }],
    reference: wpId,
  })
  console.log('[05] sliceId:', sliceR.result, 'maxLevel:', sliceR.maxLevel)
  filewrite({ result: sliceR.result, messages: sliceR.messages, maxLevel: sliceR.maxLevel }, 'slice-custom-response')

  await snapshot('after-custom')

  return { partId, sliceId: sliceR.result }
}
