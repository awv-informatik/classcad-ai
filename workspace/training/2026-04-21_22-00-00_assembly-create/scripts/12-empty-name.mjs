export default async function (api, { filewrite }) {
  // Test with empty string name
  const r1 = await api.v1.assembly.create({ name: '' })
  console.log('[12] empty name — result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.result) {
    const root = r1.structure.tree[r1.result]
    console.log('[12] actual name:', root?.name)
    console.log('[12] originalName:', root?.members?.originalName?.value)
  } else {
    console.log('[12] messages:', JSON.stringify(r1.messages))
  }

  filewrite({ result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'empty-name')
  return { asmId: r1.result }
}
