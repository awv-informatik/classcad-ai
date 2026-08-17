export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptyRefTest' })).result

  // Try with empty references array
  const r = await api.v1.part.compositeCurve({ id: partId, name: 'CC_Empty', references: [] })
  console.log('[08] compositeCurve empty refs result:', r.result)
  console.log('[08] maxLevel:', r.maxLevel)
  if (r.messages && r.messages.length > 0) {
    console.log('[08] messages:', JSON.stringify(r.messages))
  }

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'cc-empty-response')

  return { partId, ccId: r.result }
}
