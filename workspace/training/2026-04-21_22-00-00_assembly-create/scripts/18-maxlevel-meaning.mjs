export default async function (api, { filewrite }) {
  // assembly.create returns maxLevel 31 (info) — investigate what that info message is
  const r = await api.v1.assembly.create({ name: 'MaxLevelTest' })
  console.log('[18] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[18] messages array length:', r.messages?.length)
  console.log('[18] messages:', JSON.stringify(r.messages, null, 2))

  // For comparison, what does a failed create look like?
  const r2 = await api.v1.assembly.create({ name: 'Second' })
  console.log('[18] second result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[18] second messages:', JSON.stringify(r2.messages, null, 2))

  filewrite({
    success: { result: r.result, maxLevel: r.maxLevel, messages: r.messages },
    failure: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'maxlevel')
  return { asmId: r.result }
}
