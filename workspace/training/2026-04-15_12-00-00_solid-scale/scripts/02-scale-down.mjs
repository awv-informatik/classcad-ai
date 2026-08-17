// Test scale with factor < 1 (shrink)
// Include reference body for visual comparison
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleDownTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Target: 80x60x40 box at origin
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  // Reference: small cylinder offset
  const refId = (await api.v1.solid.cylinder({ id: eifId, height: 20, diameter: 15, translation: [120, 0, 0] })).result

  await snapshot('before-scale')

  // Scale box by factor 0.5 (halve it)
  const r = await api.v1.solid.scale({ id: eifId, target: boxId, factor: 0.5 })
  console.log('[02] scale 0.5 result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'scale-down-response')

  await snapshot('after-scale-half')

  return { partId, eifId, boxId }
}
