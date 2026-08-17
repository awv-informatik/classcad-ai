// Translation — offset cone from origin
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TranslationTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Reference cone at origin
  const ref = (await api.v1.solid.cone({ id: eifId, height: 80, bDiameter: 40, tDiameter: 10 })).result

  // Translated cone
  const r = await api.v1.solid.cone({ id: eifId, height: 80, bDiameter: 40, tDiameter: 10, translation: [100, 50, 0] })
  console.log('[07] translated result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('translation')
  return { partId, eifId, refId: ref, translatedId: r.result }
}
