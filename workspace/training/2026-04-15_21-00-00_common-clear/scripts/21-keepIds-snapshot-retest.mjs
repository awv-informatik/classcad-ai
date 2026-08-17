// 21 — retest: keepIds=[partId] then snapshot — on fresh worker
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Retest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[21] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  await api.v1.common.clear({ keepIds: [partId] })
  console.log('[21] cleared with keepIds=[partId]')

  // This is the potentially hanging call
  await snapshot('after-keepIds')
  console.log('[21] snapshot succeeded')

  return { partId }
}
