// Test scale with negative factor (mirror + scale?)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleNegTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Asymmetric box so mirroring is visible
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 40, height: 20 })).result
  // Reference body
  const refId = (await api.v1.solid.sphere({ id: eifId, radius: 10, translation: [120, 0, 0] })).result

  await snapshot('before-neg-scale')

  const r = await api.v1.solid.scale({ id: eifId, target: boxId, factor: -1 })
  console.log('[05] scale factor=-1 result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'scale-neg1-response')

  await snapshot('after-neg-scale')

  return { partId, eifId, boxId }
}
