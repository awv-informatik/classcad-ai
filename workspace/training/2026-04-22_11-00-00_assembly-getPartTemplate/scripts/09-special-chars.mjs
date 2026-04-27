export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  // Create templates with special character names
  const t1 = (await api.v1.assembly.partTemplate({ name: 'My Part (v2)' })).result
  const t2 = (await api.v1.assembly.partTemplate({ name: 'bolt/nut' })).result
  const t3 = (await api.v1.assembly.partTemplate({ name: 'hello world' })).result

  console.log('[09] created:', t1, t2, t3)

  // Lookup each — partTemplate preserves special chars (no sanitization)
  const r1 = await api.v1.assembly.getPartTemplate({ name: 'My Part (v2)' })
  console.log('[09] "My Part (v2)":', r1.result, 'maxLevel:', r1.maxLevel)

  const r2 = await api.v1.assembly.getPartTemplate({ name: 'bolt/nut' })
  console.log('[09] "bolt/nut":', r2.result, 'maxLevel:', r2.maxLevel)

  const r3 = await api.v1.assembly.getPartTemplate({ name: 'hello world' })
  console.log('[09] "hello world":', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    parens: { id: t1, found: r1.result },
    slash: { id: t2, found: r2.result },
    space: { id: t3, found: r3.result },
  }, 'special-chars')

  return { asmId }
}
