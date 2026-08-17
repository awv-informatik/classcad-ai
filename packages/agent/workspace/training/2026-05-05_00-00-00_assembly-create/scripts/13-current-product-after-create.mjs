export default async function (api, { filewrite }) {
  // Test: after assembly.create, is the assembly already the currentProduct?
  // Can we immediately call partTemplate without setCurrentProduct first?
  const asmId = (await api.v1.assembly.create({ name: 'ContextTest' })).result
  console.log('[13] asmId:', asmId)

  // According to structure, currentProduct = 12 after create. Let's verify
  // by calling partTemplate directly (which creates inside the current product container)
  const tplId = (await api.v1.assembly.partTemplate({ name: 'DirectAfterCreate' })).result
  console.log('[13] tplId (no setCurrentProduct call):', tplId)

  // Verify it's findable
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const found = (await api.v1.assembly.getPartTemplate({ name: 'DirectAfterCreate' })).result
  console.log('[13] found template:', found, '=== tplId?', found === tplId)

  filewrite({ asmId, tplId, found, match: found === tplId }, 'context-after-create')

  return { asmId, tplId }
}
