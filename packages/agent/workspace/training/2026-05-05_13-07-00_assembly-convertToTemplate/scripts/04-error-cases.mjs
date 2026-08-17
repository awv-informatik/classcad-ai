export default async function (api, { filewrite }) {
  // Test 1: No assembly — just a part
  const partId = (await api.v1.part.create({ name: 'JustAPart' })).result
  const r1 = await api.v1.assembly.convertToTemplate({ name: 'Fail' })
  console.log('[04] no-assembly result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[04] no-assembly messages:', JSON.stringify(r1.messages))

  // Test 2: Empty assembly (no templates, no instances)
  const asmId = (await api.v1.assembly.create({ name: 'Empty' })).result
  const r2 = await api.v1.assembly.convertToTemplate({ name: 'EmptyConvert' })
  console.log('[04] empty-asm result:', r2.result, 'maxLevel:', r2.maxLevel)
  const emptyTpl = (await api.v1.assembly.getAssemblyTemplate({ name: 'EmptyConvert' })).result
  console.log('[04] empty-asm template found:', emptyTpl)

  // Test 3: Calling convert twice in succession (second call converts the new root)
  const r3 = await api.v1.assembly.convertToTemplate({ name: 'SecondConvert' })
  console.log('[04] second-convert result:', r3.result, 'maxLevel:', r3.maxLevel)
  const secondTpl = (await api.v1.assembly.getAssemblyTemplate({ name: 'SecondConvert' })).result
  console.log('[04] second template found:', secondTpl)

  // Test 4: Name edge cases
  const r4 = await api.v1.assembly.convertToTemplate({ name: '' })
  console.log('[04] empty-name result:', r4.result, 'maxLevel:', r4.maxLevel)

  const r5 = await api.v1.assembly.convertToTemplate()
  console.log('[04] no-param result:', r5.result, 'maxLevel:', r5.maxLevel)
  // Default should be "Subassembly"
  const defaultFound = (await api.v1.assembly.getAssemblyTemplate({ name: 'Subassembly' })).result
  console.log('[04] default name template found:', defaultFound)

  filewrite({
    noAssembly: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    emptyAsm: { result: r2.result, maxLevel: r2.maxLevel, templateFound: emptyTpl },
    secondConvert: { result: r3.result, maxLevel: r3.maxLevel, templateFound: secondTpl },
    emptyName: { result: r4.result, maxLevel: r4.maxLevel },
    noParam: { result: r5.result, maxLevel: r5.maxLevel, defaultFound },
  }, 'error-cases')

  return {}
}
