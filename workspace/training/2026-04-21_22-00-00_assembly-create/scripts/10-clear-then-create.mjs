export default async function (api, { filewrite }) {
  // Create assembly, then clear, then create again
  const r1 = await api.v1.assembly.create({ name: 'First' })
  console.log('[10] first create result:', r1.result, 'maxLevel:', r1.maxLevel)

  const clearR = await api.v1.common.clear({})
  console.log('[10] clear result:', clearR.result, 'maxLevel:', clearR.maxLevel)

  const r2 = await api.v1.assembly.create({ name: 'AfterClear' })
  console.log('[10] second create result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[10] second root name:', r2.structure.tree[r2.result]?.name)

  filewrite({
    first: { result: r1.result, maxLevel: r1.maxLevel },
    clear: { result: clearR.result, maxLevel: clearR.maxLevel },
    second: { result: r2.result, maxLevel: r2.maxLevel },
  }, 'clear-then-create')
  return { asmId: r2.result }
}
