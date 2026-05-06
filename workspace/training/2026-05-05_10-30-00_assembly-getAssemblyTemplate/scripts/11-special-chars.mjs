export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  // Create template with special characters
  const t1 = (await api.v1.assembly.assemblyTemplate({ name: 'My Sub (v2)' })).result
  const t2 = (await api.v1.assembly.assemblyTemplate({ name: 'Gear-Box_01' })).result
  const t3 = (await api.v1.assembly.assemblyTemplate({ name: 'A B C' })).result
  console.log('[11] created:', t1, t2, t3)

  // List to see what names the server actually stored
  const all = await api.v1.assembly.getAssemblyTemplate()
  console.log('[11] all templates:', all.result)

  // Try finding by original name
  const r1orig = await api.v1.assembly.getAssemblyTemplate({ name: 'My Sub (v2)' })
  const r2orig = await api.v1.assembly.getAssemblyTemplate({ name: 'Gear-Box_01' })
  const r3orig = await api.v1.assembly.getAssemblyTemplate({ name: 'A B C' })

  console.log('[11] "My Sub (v2)":', r1orig.result, 'maxLevel:', r1orig.maxLevel)
  console.log('[11] "Gear-Box_01":', r2orig.result, 'maxLevel:', r2orig.maxLevel)
  console.log('[11] "A B C":', r3orig.result, 'maxLevel:', r3orig.maxLevel)

  // Try finding by sanitized name (underscores replacing special chars)
  const r1san = await api.v1.assembly.getAssemblyTemplate({ name: 'My_Sub__v2_' })
  const r2san = await api.v1.assembly.getAssemblyTemplate({ name: 'Gear_Box_01' })
  const r3san = await api.v1.assembly.getAssemblyTemplate({ name: 'A_B_C' })

  console.log('[11] "My_Sub__v2_":', r1san.result, 'maxLevel:', r1san.maxLevel)
  console.log('[11] "Gear_Box_01":', r2san.result, 'maxLevel:', r2san.maxLevel)
  console.log('[11] "A_B_C":', r3san.result, 'maxLevel:', r3san.maxLevel)

  filewrite({
    created: { t1, t2, t3 },
    origNames: {
      'My Sub (v2)': { result: r1orig.result, maxLevel: r1orig.maxLevel },
      'Gear-Box_01': { result: r2orig.result, maxLevel: r2orig.maxLevel },
      'A B C': { result: r3orig.result, maxLevel: r3orig.maxLevel },
    },
    sanitizedNames: {
      'My_Sub__v2_': { result: r1san.result, maxLevel: r1san.maxLevel },
      'Gear_Box_01': { result: r2san.result, maxLevel: r2san.maxLevel },
      'A_B_C': { result: r3san.result, maxLevel: r3san.maxLevel },
    },
  }, 'special-chars')

  return { asmId }
}
