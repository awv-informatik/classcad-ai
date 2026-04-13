export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoxTranslation' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Box at origin (reference)
  const box1 = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result
  console.log('[02] box1 (origin):', box1)

  // Box translated in x, y, z
  const r = await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20, translation: [60, 40, 30] })
  console.log('[02] box2 (translated):', r.result, 'maxLevel:', r.maxLevel)

  filewrite({ box1, box2: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'translation-response')

  await snapshot('two-boxes')
  return { partId }
}
