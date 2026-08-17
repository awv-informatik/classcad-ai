export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'DoubleDeleteTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Part1' })).result
  await api.v1.part.box({ id: tpl1, length: 30, width: 20, height: 10 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[08] tpl1:', tpl1)

  // First delete — should succeed
  const r1 = await api.v1.assembly.deleteTemplate({ ids: [tpl1] })
  console.log('[08] first delete result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[08] messages:', JSON.stringify(r1.messages))

  // Second delete of same ID — should fail
  const r2 = await api.v1.assembly.deleteTemplate({ ids: [tpl1] })
  console.log('[08] second delete result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[08] messages:', JSON.stringify(r2.messages))
  filewrite({ first: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
              second: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages } }, 'double-delete')

  return { asmId }
}
