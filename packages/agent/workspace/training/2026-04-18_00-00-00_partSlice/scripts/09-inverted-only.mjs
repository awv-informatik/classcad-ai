export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceInvOnly' })).result

  // Box fully in positive z: z=0 to z=60
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 60, width: 40, height: 60 })).result
  const refId = (await api.v1.part.cylinder({ id: partId, name: 'Ref', diameter: 10, height: 15, translation: [80, 20, 0] })).result

  // Custom plane at z=30 (middle of box)
  const wpId = (await api.v1.part.workPlane({
    id: partId,
    name: 'MidPlane',
    origin: [0, 0, 30],
    normal: [0, 0, 1],
    xDirection: [1, 0, 0],
  })).result

  await snapshot('before')

  // inverted=1 (TRUE) → keep side OPPOSITE to normal → keep -Z side → z=0 to z=30
  const sliceR = await api.v1.part.slice({
    id: partId,
    targets: [{ id: boxId }],
    reference: wpId,
    inverted: 1,
  })
  console.log('[09] inverted=1 sliceId:', sliceR.result, 'maxLevel:', sliceR.maxLevel)
  filewrite({ result: sliceR.result, messages: sliceR.messages, maxLevel: sliceR.maxLevel }, 'inv-true-response')

  await snapshot('after-inverted')

  return { partId, sliceId: sliceR.result }
}
