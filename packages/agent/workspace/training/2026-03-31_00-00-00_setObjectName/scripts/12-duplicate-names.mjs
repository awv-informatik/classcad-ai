// 12 — Can two objects have the same name? (use features within one part)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const eif1 = (await api.v1.part.entityInjection({ id: partId, name: 'Feature1' })).result
  const eif2 = (await api.v1.part.entityInjection({ id: partId, name: 'Feature2' })).result
  console.log('[12] partId:', partId, 'eif1:', eif1, 'eif2:', eif2)

  // Rename eif2 to the same name as eif1
  const r = await api.v1.common.setObjectName({ id: eif2, name: 'Feature1' })
  console.log('[12] rename eif2 to "Feature1" → result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[12] messages:', JSON.stringify(r.messages))

  filewrite(r.structure, 'structure-dup-names')
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'dup-name-response')

  return { partId, eif1, eif2 }
}
