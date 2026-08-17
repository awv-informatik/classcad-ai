export default async function (api, { filewrite }) {
  // Test special characters in name
  const r = await api.v1.assembly.create({ name: 'My Assembly (v2) — test/spec' })
  console.log('[20] result:', r.result, 'maxLevel:', r.maxLevel)

  if (r.result) {
    const root = r.structure.tree[r.result]
    console.log('[20] name:', root?.name)
    console.log('[20] originalName:', root?.members?.originalName?.value)
  } else {
    console.log('[20] messages:', JSON.stringify(r.messages))
  }

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'special-chars')
  return { asmId: r.result }
}
