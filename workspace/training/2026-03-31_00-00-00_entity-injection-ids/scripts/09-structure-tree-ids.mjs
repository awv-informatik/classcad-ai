// Q: What does the structure tree look like? How do solid IDs map to structure nodes?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'MyEI' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const cylId = (await api.v1.solid.cylinder({ id: eifId, radius: 15, height: 50, translation: [80, 0, 0] })).result
  console.log('[09] partId:', partId, 'eifId:', eifId, 'boxId:', boxId, 'cylId:', cylId)

  // Get structure tree after creating solids
  const r = await api.v1.solid.box({ id: eifId, length: 1, width: 1, height: 1 })
  // Actually, let's just read the structure from any API call
  const probe = await api.v1.common.getAppVersion({})
  // Structure comes with every response — but it may be empty for stateless calls.
  // Let's use the last creation call's structure instead.

  // Get structure from the cylinder creation
  const cylR = await api.v1.solid.cylinder({ id: eifId, radius: 10, height: 20, translation: [0, 80, 0] })
  filewrite(cylR.structure, 'structure-after-solids')

  console.log('[09] Structure node count:', cylR.structure ? cylR.structure.length : 'null')

  return { partId, eifId, boxId, cylId }
}
