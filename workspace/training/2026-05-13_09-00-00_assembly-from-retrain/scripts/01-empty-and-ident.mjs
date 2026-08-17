// 01 — empty body, and top-level `ident` — does it become the root's name?
// The return envelope of `from` includes the full structure tree; we mine the
// root node's name field directly from that instead of re-querying.
function findRootName(structure) {
  // structure trees in classcad have nested children arrays under "objects"
  const walk = (node) => {
    if (!node) return null
    if (node.type === 'CC_AssemblyRoot') {
      return node.name ?? node.ident ?? null
    }
    if (Array.isArray(node.objects)) {
      for (const child of node.objects) {
        const r = walk(child)
        if (r != null) return r
      }
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        const r = walk(child)
        if (r != null) return r
      }
    }
    return null
  }
  return walk(structure)
}

export default async function (api, { filewrite }) {
  // A: empty arrays only (no ident)
  const a = await api.v1.assembly.from({
    data: JSON.stringify({ templates: [], instances: [], constraints: [] }),
    format: 'JSON',
  })
  console.log('[A] empty result:', a.result, 'maxLevel:', a.maxLevel)
  console.log('[A] root name from structure:', findRootName(a.structure))
  filewrite(a.structure, 'A-structure')

  await api.v1.common.clear({})

  // B: with top-level `ident: "MyAssembly"`
  const b = await api.v1.assembly.from({
    data: JSON.stringify({
      ident: 'MyAssembly',
      templates: [],
      instances: [],
      constraints: [],
    }),
    format: 'JSON',
  })
  console.log('[B] with-ident result:', b.result, 'maxLevel:', b.maxLevel)
  console.log('[B] root name from structure:', findRootName(b.structure))
  filewrite(b.structure, 'B-structure')

  filewrite({ a: a.messages, b: b.messages }, 'messages')

  return { aId: a.result, bId: b.result }
}
