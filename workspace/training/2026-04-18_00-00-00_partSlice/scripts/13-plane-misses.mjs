export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceMiss' })).result

  // Box at z=0 to z=50
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 60, width: 40, height: 50 })).result

  // Work plane at z=100 — completely above the box
  const wpId = (await api.v1.part.workPlane({
    id: partId,
    name: 'HighPlane',
    origin: [0, 0, 100],
    normal: [0, 0, 1],
    xDirection: [1, 0, 0],
  })).result

  // Slice where the plane misses the box entirely
  const sliceR = await api.v1.part.slice({
    id: partId,
    targets: [{ id: boxId }],
    reference: wpId,
  })
  console.log('[13] plane misses - sliceId:', sliceR.result, 'maxLevel:', sliceR.maxLevel)
  filewrite({ result: sliceR.result, messages: sliceR.messages, maxLevel: sliceR.maxLevel }, 'misses-response')

  if (sliceR.result) await snapshot('misses')

  return { partId, sliceId: sliceR.result }
}
