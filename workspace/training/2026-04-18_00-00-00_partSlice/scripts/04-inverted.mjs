export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceInverted' })).result

  // Box: z from -30 to +30, with ref cylinder at z=0 height
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 60, width: 40, height: 60, translation: [0, 0, -30] })).result
  const refId = (await api.v1.part.cylinder({ id: partId, name: 'Ref', diameter: 10, height: 15, translation: [80, 20, 0] })).result

  await snapshot('before')

  // Slice with inverted=TRUE → should keep the OPPOSITE side (the -Z side, z=-30 to z=0)
  const topWpId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const sliceR = await api.v1.part.slice({
    id: partId,
    targets: [{ id: boxId }],
    reference: topWpId,
    inverted: 1, // TRUE
  })
  console.log('[04] sliceId:', sliceR.result, 'maxLevel:', sliceR.maxLevel)
  filewrite({ result: sliceR.result, messages: sliceR.messages, maxLevel: sliceR.maxLevel }, 'slice-inverted-response')

  await snapshot('after-inverted')

  return { partId, sliceId: sliceR.result }
}
