export default async function (api, { filewrite }) {
  // Test with no params at all
  const r = await api.v1.assembly.create()
  console.log('[13] no params — result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.result) {
    const root = r.structure.tree[r.result]
    console.log('[13] name:', root?.name)
    console.log('[13] class:', root?.class)
  }

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'no-params')
  return { asmId: r.result }
}
