export default async function (api, { filewrite }) {
  // Test: part.create → clear → assembly.create
  const partR = await api.v1.part.create({ name: 'TempPart' })
  console.log('[15] part.create:', partR.result)

  await api.v1.common.clear({})
  console.log('[15] cleared')

  const asmR = await api.v1.assembly.create({ name: 'AfterPartClear' })
  console.log('[15] assembly.create:', asmR.result, 'maxLevel:', asmR.maxLevel)

  if (asmR.result) {
    const root = asmR.structure.tree[asmR.result]
    console.log('[15] root name:', root?.name, 'class:', root?.class)
  }

  filewrite({ result: asmR.result, maxLevel: asmR.maxLevel, messages: asmR.messages }, 'part-clear-asm')
  return { asmId: asmR.result }
}
