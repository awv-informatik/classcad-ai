export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SlicePlainIds' })).result

  // Test passing targets as plain IDs instead of objects
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 60, width: 40, height: 50 })).result

  const topWpId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  // Try: targets as plain ID array [boxId] instead of [{ id: boxId }]
  const sliceR = await api.v1.part.slice({
    id: partId,
    targets: [boxId],
    reference: topWpId,
  })
  console.log('[07] plain IDs - sliceId:', sliceR.result, 'maxLevel:', sliceR.maxLevel)
  filewrite({ result: sliceR.result, messages: sliceR.messages, maxLevel: sliceR.maxLevel }, 'plain-ids-response')

  await snapshot('plain-ids')

  return { partId, sliceId: sliceR.result }
}
