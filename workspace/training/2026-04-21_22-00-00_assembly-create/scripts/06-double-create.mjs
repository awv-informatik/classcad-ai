export default async function (api, { filewrite }) {
  // Create first assembly
  const r1 = await api.v1.assembly.create({ name: 'First' })
  console.log('[06] first create result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Try to create a second assembly
  const r2 = await api.v1.assembly.create({ name: 'Second' })
  console.log('[06] second create result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[06] second messages:', JSON.stringify(r2.messages, null, 2))

  filewrite({
    first: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    second: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'double-create')
  return { asmId: r1.result }
}
