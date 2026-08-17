export default async function (api, { snapshot, filewrite }) {
  // Basic assembly.create with no params
  const r = await api.v1.assembly.create({})
  console.log('[01] create result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'create-response')

  await snapshot('empty-assembly')
  return { asmId: r.result }
}
