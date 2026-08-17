export default async function (api, { filewrite }) {
  // Error case: call convertToTemplate when a part exists (not an assembly)
  const partId = (await api.v1.part.create({ name: 'MyPart' })).result
  console.log('[08] partId:', partId)

  const r = await api.v1.assembly.convertToTemplate({ name: 'ShouldFail' })
  console.log('[08] result:', r.result)
  console.log('[08] maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'part-context-error')

  return {}
}
