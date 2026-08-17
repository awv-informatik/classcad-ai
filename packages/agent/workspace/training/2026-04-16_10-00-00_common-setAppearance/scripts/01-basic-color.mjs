// Test basic color setting on a solid feature (entity injection with a box)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AppearanceTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

  console.log('[01] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Snapshot before appearance change
  await snapshot('before')

  // Set red color
  const r1 = await api.v1.common.setAppearance({ target: eifId, color: [255, 0, 0] })
  console.log('[01] setAppearance red result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'red-response')

  await snapshot('after-red')

  // Set green color
  const r2 = await api.v1.common.setAppearance({ target: eifId, color: [0, 255, 0] })
  console.log('[01] setAppearance green result:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('after-green')

  // Set blue color
  const r3 = await api.v1.common.setAppearance({ target: eifId, color: [0, 0, 255] })
  console.log('[01] setAppearance blue result:', r3.result, 'maxLevel:', r3.maxLevel)

  await snapshot('after-blue')

  return { partId, eifId, boxId }
}
