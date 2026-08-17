// part.create with empty object — default name
export default async function (api, { filewrite }) {
  const r = await api.v1.part.create({})
  console.log('[02] result:', r.result)
  console.log('[02] maxLevel:', r.maxLevel)
  // Check what name was assigned
  const tree = r.structure.tree
  const partNode = Object.values(tree).find(n => n.class !== 'AllObjects' && n.parent !== null)
  if (partNode) {
    console.log('[02] part name:', partNode.name)
    console.log('[02] part class:', partNode.class)
  }
  filewrite(r.structure, 'structure-no-params')
  return { partId: r.result }
}
