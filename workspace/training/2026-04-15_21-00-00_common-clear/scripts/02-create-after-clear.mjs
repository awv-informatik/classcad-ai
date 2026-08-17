// 02 — create objects after clear, check if state is clean
export default async function (api, { snapshot, filewrite }) {
  // Create initial geometry
  const partId1 = (await api.v1.part.create({ name: 'Before' })).result
  const eifId1 = (await api.v1.part.entityInjection({ id: partId1, name: 'EIF1' })).result
  const boxId1 = (await api.v1.solid.box({ id: eifId1, length: 60, width: 40, height: 30 })).result
  console.log('[02] before clear — partId:', partId1, 'eifId:', eifId1, 'boxId:', boxId1)

  // Clear
  await api.v1.common.clear({})
  console.log('[02] cleared')

  // Create new geometry after clear
  const partId2 = (await api.v1.part.create({ name: 'After' })).result
  const eifId2 = (await api.v1.part.entityInjection({ id: partId2, name: 'EIF2' })).result
  const boxId2 = (await api.v1.solid.box({ id: eifId2, length: 80, width: 50, height: 20 })).result
  console.log('[02] after clear — partId:', partId2, 'eifId:', eifId2, 'boxId:', boxId2)

  // Check if old IDs are reused or if counter continues
  console.log('[02] ID continuity: partId1=', partId1, 'partId2=', partId2)
  console.log('[02] IDs reused:', partId1 === partId2)

  await snapshot('after-recreate')

  return { partId1, partId2, boxId2 }
}
