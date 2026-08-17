export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GFO_InstId' })).result

  const partTpl = (await api.v1.assembly.partTemplate({ name: 'Cube' })).result
  await api.v1.part.box({ id: partTpl, name: 'Box', length: 30, width: 30, height: 30 })
  const wcs = (await api.v1.part.workCSys({
    id: partTpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Sub-assembly template
  const subAsmTpl = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result

  const subInst = (await api.v1.assembly.instance({
    productId: partTpl, ownerId: subAsmTpl, name: 'Inner',
  })).result

  const subFo = (await api.v1.assembly.fastenedOrigin({
    id: subAsmTpl, name: 'InnerFO',
    mate1: { path: [subInst], csys: wcs },
    xOffset: 42,
  })).result

  // Instance sub-asm in root
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const subAsmInst = (await api.v1.assembly.instance({
    productId: subAsmTpl, ownerId: asmId, name: 'SubAsmInst',
  })).result

  // Try getFastenedOrigin with the sub-assembly instance ID
  const r = await api.v1.assembly.getFastenedOrigin({ id: subAsmInst, name: 'InnerFO' })
  console.log('[13] subAsmInst ID result:', r.result ? JSON.stringify(r.result) : null)
  console.log('[13] maxLevel:', r.maxLevel)
  console.log('[13] messages:', JSON.stringify(r.messages))

  // Also try with sub-assembly template ID
  const r2 = await api.v1.assembly.getFastenedOrigin({ id: subAsmTpl, name: 'InnerFO' })
  console.log('[13] subAsmTpl ID result:', r2.result ? JSON.stringify(r2.result) : null)
  console.log('[13] subAsmTpl maxLevel:', r2.maxLevel)

  filewrite({
    subAsmInst: { result: r.result, maxLevel: r.maxLevel, messages: r.messages },
    subAsmTpl: { result: r2.result, maxLevel: r2.maxLevel },
  }, 'instance-id-subasm')

  return { asmId }
}
