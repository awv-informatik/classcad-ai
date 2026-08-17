export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // No name
  const r1 = await api.v1.assembly.getRevolute({ id: asmId })
  console.log('[10] no name — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[10] no name — messages:', JSON.stringify(r1.messages))

  // No id
  const r2 = await api.v1.assembly.getRevolute({ name: 'Test' })
  console.log('[10] no id — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[10] no id — messages:', JSON.stringify(r2.messages))

  // Empty object
  const r3 = await api.v1.assembly.getRevolute({})
  console.log('[10] empty — result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[10] empty — messages:', JSON.stringify(r3.messages))

  filewrite({
    noName: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    noId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    empty: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'missing-params')

  return { asmId }
}
