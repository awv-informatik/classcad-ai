export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TranslationTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  // Create two boxes — one will be transformed, one is a reference
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result
  const refId = (await api.v1.solid.box({ id: eifId, length: 10, width: 10, height: 10, translation: [-30, -30, 0] })).result

  console.log('[01] boxId:', boxId, 'refId:', refId)

  await snapshot('before')

  // Pure translation: identity rotation + [100, 50, 0] offset
  const r = await api.v1.common.transformObjectWithMatrix({
    id: boxId,
    matrix: [
      [1, 0, 0, 100],
      [0, 1, 0, 50],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })

  console.log('[01] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'translation-response')

  await snapshot('after')

  return { partId, eifId, boxId }
}
