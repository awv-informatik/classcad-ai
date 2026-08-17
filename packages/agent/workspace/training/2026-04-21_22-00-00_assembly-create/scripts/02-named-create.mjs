export default async function (api, { filewrite }) {
  const r = await api.v1.assembly.create({ name: 'MyAssembly' })
  console.log('[02] create result:', r.result, 'maxLevel:', r.maxLevel)

  const tree = r.structure.tree
  const root = tree[r.result]
  console.log('[02] root name:', root.name)
  console.log('[02] root class:', root.class)
  console.log('[02] root originalName:', root.members?.originalName?.value)

  filewrite({ result: r.result, rootNode: root }, 'named-create')
  return { asmId: r.result }
}
