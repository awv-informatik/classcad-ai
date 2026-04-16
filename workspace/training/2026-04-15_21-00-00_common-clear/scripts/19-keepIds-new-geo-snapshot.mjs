// 19 — keepIds: add new geometry after clear, then snapshot
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NewGeo' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[19] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Keep part + eif
  await api.v1.common.clear({ keepIds: [partId, eifId] })
  console.log('[19] cleared with keepIds=[partId, eifId]')

  // Create new box in kept eif
  const newBox = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 40 })).result
  console.log('[19] new box:', newBox)

  // NOW try snapshot — should work because there's valid geometry
  await snapshot('after-keepIds-with-newgeo')
  console.log('[19] snapshot succeeded')

  return { partId }
}
