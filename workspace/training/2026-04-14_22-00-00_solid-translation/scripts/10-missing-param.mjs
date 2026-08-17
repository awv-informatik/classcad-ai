// 10 — Missing translation param, missing target param
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MissingParam' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 50, height: 50 })).result

  // Missing translation param
  const r1 = await api.v1.solid.translation({ id: eifId, target: boxId })
  console.log('[10] missing translation — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[10] missing translation — messages:', JSON.stringify(r1.messages))

  // Missing target param
  const r2 = await api.v1.solid.translation({ id: eifId, translation: [10, 0, 0] })
  console.log('[10] missing target — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[10] missing target — messages:', JSON.stringify(r2.messages))

  filewrite({
    missingTranslation: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    missingTarget: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'missing-param-response')

  return { boxId }
}
