export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceInvPos' })).result

  // Box fully in positive z space: z from 0 to 60
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 60, width: 40, height: 60 })).result
  const refId = (await api.v1.part.cylinder({ id: partId, name: 'Ref', diameter: 10, height: 15, translation: [80, 20, 0] })).result

  // Custom plane at z=30 (middle of the box)
  const wpId = (await api.v1.part.workPlane({
    id: partId,
    name: 'MidPlane',
    origin: [0, 0, 30],
    normal: [0, 0, 1],
    xDirection: [1, 0, 0],
  })).result

  await snapshot('before')

  // Test 1: inverted=FALSE → keep +Z side (z=30 to z=60)
  const sliceR1 = await api.v1.part.slice({
    id: partId,
    targets: [{ id: boxId }],
    reference: wpId,
    inverted: 0,
  })
  console.log('[08] inverted=0 sliceId:', sliceR1.result, 'maxLevel:', sliceR1.maxLevel)
  filewrite({ result: sliceR1.result, messages: sliceR1.messages, maxLevel: sliceR1.maxLevel }, 'inv-false-response')
  await snapshot('inv-false')

  // Now create a new part for the inverted=TRUE test
  const partId2 = (await api.v1.part.create({ name: 'SliceInvTrue' })).result
  const boxId2 = (await api.v1.part.box({ id: partId2, name: 'Box', length: 60, width: 40, height: 60 })).result
  const refId2 = (await api.v1.part.cylinder({ id: partId2, name: 'Ref', diameter: 10, height: 15, translation: [80, 20, 0] })).result
  const wpId2 = (await api.v1.part.workPlane({
    id: partId2,
    name: 'MidPlane',
    origin: [0, 0, 30],
    normal: [0, 0, 1],
    xDirection: [1, 0, 0],
  })).result

  // Test 2: inverted=TRUE → keep -Z side (z=0 to z=30)
  const sliceR2 = await api.v1.part.slice({
    id: partId2,
    targets: [{ id: boxId2 }],
    reference: wpId2,
    inverted: 1,
  })
  console.log('[08] inverted=1 sliceId:', sliceR2.result, 'maxLevel:', sliceR2.maxLevel)
  filewrite({ result: sliceR2.result, messages: sliceR2.messages, maxLevel: sliceR2.maxLevel }, 'inv-true-response')
  await snapshot('inv-true')

  return { partId, partId2 }
}
