// Two part.create calls — does second clear the first?
export default async function (api, { filewrite }) {
  const r1 = await api.v1.part.create({ name: 'First' })
  const id1 = r1.result
  console.log('[04] first partId:', id1)
  console.log('[04] first tree nodes:', Object.keys(r1.structure.tree).length)

  const r2 = await api.v1.part.create({ name: 'Second' })
  const id2 = r2.result
  console.log('[04] second partId:', id2)
  console.log('[04] second tree nodes:', Object.keys(r2.structure.tree).length)
  console.log('[04] same ID?', id1 === id2)

  // Check if first part is still in the tree
  const tree2 = r2.structure.tree
  const names = Object.values(tree2).map(n => n.name)
  console.log('[04] names in tree:', names.join(', '))
  console.log('[04] "First" still in tree:', names.includes('First'))

  filewrite(r2.structure, 'double-create-structure')
  return { id1, id2, names }
}
