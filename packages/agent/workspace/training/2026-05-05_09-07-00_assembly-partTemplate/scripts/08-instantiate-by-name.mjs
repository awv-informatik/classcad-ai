export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'NameInstTest' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
  await api.v1.part.box({ id: tplId, name: 'Body', length: 50, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instantiate by numeric ID (normal)
  const r1 = await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'ByID' })
  console.log('[08] by ID result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Instantiate by template name string
  const r2 = await api.v1.assembly.instance({
    productId: 'Bracket', ownerId: asmId, name: 'ByName',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[08] by name "Bracket" result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length > 0) {
    console.log('[08] by name messages:', JSON.stringify(r2.messages))
  }

  // Verify both instances exist and have same geometry
  if (r1.result && r2.result) {
    const m1 = (await api.v1.assembly.calculateMassProperties({ id: r1.result })).result
    const m2 = (await api.v1.assembly.calculateMassProperties({ id: r2.result })).result
    console.log('[08] COG by-ID instance:', JSON.stringify(m1.cog), 'vol:', m1.volume)
    console.log('[08] COG by-name instance:', JSON.stringify(m2.cog), 'vol:', m2.volume)
    filewrite({ byId: { id: r1.result, mass: m1 }, byName: { id: r2.result, mass: m2 } }, 'instantiate-by-name')
  }

  await snapshot('both-instances')
  return { asmId }
}
