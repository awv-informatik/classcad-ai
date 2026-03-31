// Q: Correct flow — part → EI → solid.box. What IDs come back?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'MyEI' })).result
  console.log('[02] partId:', partId, 'eifId:', eifId)

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  console.log('[02] solid.box result (boxId):', boxId)

  await snapshot('box-in-ei')
  return { partId, eifId, boxId }
}
