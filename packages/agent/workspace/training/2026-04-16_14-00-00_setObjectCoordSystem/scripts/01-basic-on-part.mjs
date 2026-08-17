// Test setObjectCoordSystem on a part — does it reposition geometry?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CoordSysTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[01] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  await snapshot('before')

  // Set a new coord system on the part — shift origin to [50, 50, 0]
  const r = await api.v1.common.setObjectCoordSystem({
    id: partId,
    origin: [50, 50, 0],
    xVec: [1, 0, 0],
    yVec: [0, 1, 0],
  })
  console.log('[01] setObjectCoordSystem on part result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'part-coordsys-response')

  await snapshot('after-part')

  return { partId, eifId, boxId }
}
