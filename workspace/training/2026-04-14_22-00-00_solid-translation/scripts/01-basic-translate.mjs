// 01 — Basic solid.translation: translate a box along X, check return value and result
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TranslationTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create a box at origin
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 50, height: 50 })).result
  console.log('[01] boxId:', boxId)

  await snapshot('before')

  // Translate along X by 80
  const r = await api.v1.solid.translation({ id: eifId, target: boxId, translation: [80, 0, 0] })
  console.log('[01] translation result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'translation-response')

  await snapshot('after-translate-x80')

  return { partId, eifId, boxId, translationResult: r.result }
}
