// 08 — Large translation values and fractional values
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LargeValues' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const refId = (await api.v1.solid.cylinder({ id: eifId, height: 20, diameter: 15 })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30 })).result

  // Large translation
  const r1 = await api.v1.solid.translation({ id: eifId, target: boxId, translation: [10000, 0, 0] })
  console.log('[08] large translate result:', r1.result, 'maxLevel:', r1.maxLevel)

  await snapshot('after-large')

  // Fractional translation
  const r2 = await api.v1.solid.translation({ id: eifId, target: boxId, translation: [0.001, 0.5, -0.123] })
  console.log('[08] fractional translate result:', r2.result, 'maxLevel:', r2.maxLevel)

  return { boxId }
}
