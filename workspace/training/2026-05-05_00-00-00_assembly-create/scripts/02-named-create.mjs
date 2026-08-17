export default async function (api, { filewrite }) {
  // Test assembly.create with name and ident params
  const r1 = await api.v1.assembly.create({ name: 'MyAssembly', ident: 'ASM-001' })
  console.log('[02] named create result:', r1.result, 'maxLevel:', r1.maxLevel)

  filewrite({ result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'named-create')

  // Dump structure to see the assembly node in the tree
  filewrite(r1.structure, 'structure-after-create')

  return { asmId: r1.result }
}
