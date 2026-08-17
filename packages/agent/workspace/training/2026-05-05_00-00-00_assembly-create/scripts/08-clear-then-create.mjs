export default async function (api, { filewrite }) {
  // Test: clear drawing first, then assembly.create succeeds
  // First create something (part)
  const partId = (await api.v1.part.create({ name: 'Temp' })).result
  console.log('[08] part created:', partId)

  // Clear drawing
  await api.v1.common.clear({})
  console.log('[08] cleared')

  // Now assembly.create should work
  const r = await api.v1.assembly.create({ name: 'AfterClear' })
  console.log('[08] assembly.create result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'clear-then-create')

  return { asmId: r.result }
}
