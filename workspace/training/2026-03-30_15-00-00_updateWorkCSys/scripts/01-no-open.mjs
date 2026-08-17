// Test: updateWorkCSys without openFeature
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const csId = (await api.v1.part.workCSys({ id: partId, name: 'CS1' })).result

  const r = await api.v1.part.updateWorkCSys({ id: csId, offset: [10, 10, 10] })
  console.log('[01] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'no-open')
  return { partId }
}
