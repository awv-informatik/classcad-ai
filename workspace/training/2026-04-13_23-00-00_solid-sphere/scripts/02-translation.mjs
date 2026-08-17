// Sphere with translation — compare position to untranslated reference
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereTranslation' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Reference sphere at origin
  const ref = await api.v1.solid.sphere({ id: eifId, radius: 30 })
  console.log('[02] reference sphere:', ref.result, 'maxLevel:', ref.maxLevel)

  // Translated sphere
  const r = await api.v1.solid.sphere({ id: eifId, radius: 30, translation: [80, 0, 40] })
  console.log('[02] translated sphere:', r.result, 'maxLevel:', r.maxLevel)

  filewrite({ refId: ref.result, translatedId: r.result, refMaxLevel: ref.maxLevel, translatedMaxLevel: r.maxLevel }, 'translation-response')

  await snapshot('two-spheres')

  return { partId, eifId }
}
