export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptyPart' })).result
  console.log('[05] partId:', partId)

  // Try creating views on an empty part (no geometry)
  const r = await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'ISO'] })
  console.log('[05] empty part result:', JSON.stringify(r.result), 'maxLevel:', r.maxLevel)
  if (r.messages.length > 0) {
    console.log('[05] messages:', JSON.stringify(r.messages))
  }
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'empty-part-response')

  // Also test: empty types array
  const r2 = await api.v1.drawing2d.view({ id: partId, types: [] })
  console.log('[05] empty types result:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)
  if (r2.messages.length > 0) {
    console.log('[05] empty types messages:', JSON.stringify(r2.messages))
  }

  // Invalid id
  const r3 = await api.v1.drawing2d.view({ id: 99999, types: ['TOP'] })
  console.log('[05] invalid id result:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)
  if (r3.messages.length > 0) {
    console.log('[05] invalid id messages:', JSON.stringify(r3.messages))
  }

  return { partId }
}
