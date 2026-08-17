export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptyPart' })).result
  console.log('[01] partId:', partId)

  // moveToEnd on a part with no custom features (only default work geometry)
  const r = await api.v1.part.operationMoveToEnd({ id: partId })
  console.log('[01] moveToEnd empty part — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'moveToEnd-empty')

  return { partId }
}
