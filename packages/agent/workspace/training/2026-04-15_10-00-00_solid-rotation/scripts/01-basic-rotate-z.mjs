// Test basic rotation around Z axis (π/4 = 45°)
// Using a non-cubic box so rotation is visually distinct
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotationTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Non-cubic box so rotation is visible
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 40, height: 20 })).result
  // Reference body that stays fixed
  const refId = (await api.v1.solid.sphere({ id: eifId, radius: 10, translation: [-40, -40, 0] })).result

  console.log('[01] boxId:', boxId, 'refId:', refId)
  await snapshot('before')

  const r = await api.v1.solid.rotation({ id: eifId, target: boxId, rotation: [0, 0, Math.PI / 4] })
  console.log('[01] rotation result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'rotation-z-response')

  await snapshot('after-rotate-z45')
  return { partId, eifId, boxId }
}
