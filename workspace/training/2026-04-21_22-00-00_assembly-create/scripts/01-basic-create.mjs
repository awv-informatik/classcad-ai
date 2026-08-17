export default async function (api, { filewrite }) {
  const r = await api.v1.assembly.create({})
  console.log('[01] create result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'create-response')
  filewrite(r.structure, 'structure')
  return { asmId: r.result }
}
