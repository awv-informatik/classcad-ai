export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  console.log('[02] asmId:', asmId)

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  const boxFeat = (await api.v1.part.box({ id: tplId, length: 40, width: 30, height: 20 })).result
  console.log('[02] tplId:', tplId, 'boxFeat:', boxFeat)

  // Create a sub-assembly template
  const subAsmTplId = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  console.log('[02] subAsmTplId:', subAsmTplId)

  // Switch to assembly root first
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create instances
  const instId = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'BoxInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  console.log('[02] instId:', instId)

  // Test 1: root assembly ID
  const r1 = await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[02] root asm:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ type: 'root-assembly', result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'r1-root-asm')

  // Test 2: part template ID
  const r2 = await api.v1.assembly.setCurrentProduct({ id: tplId })
  console.log('[02] part tpl:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ type: 'part-template', result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, 'r2-part-tpl')

  // Test 3: assembly template ID
  await api.v1.assembly.setCurrentProduct({ id: asmId }) // reset
  const r3 = await api.v1.assembly.setCurrentProduct({ id: subAsmTplId })
  console.log('[02] asm tpl:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ type: 'assembly-template', result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }, 'r3-asm-tpl')

  // Test 4: instance ID
  await api.v1.assembly.setCurrentProduct({ id: asmId }) // reset
  const r4 = await api.v1.assembly.setCurrentProduct({ id: instId })
  console.log('[02] instance:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ type: 'instance', result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages }, 'r4-instance')

  // Test 5: feature ID (box feature)
  await api.v1.assembly.setCurrentProduct({ id: asmId }) // reset
  const r5 = await api.v1.assembly.setCurrentProduct({ id: boxFeat })
  console.log('[02] feature:', r5.result, 'maxLevel:', r5.maxLevel)
  filewrite({ type: 'feature', result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages }, 'r5-feature')

  // Test 6: invalid numeric ID
  await api.v1.assembly.setCurrentProduct({ id: asmId }) // reset
  const r6 = await api.v1.assembly.setCurrentProduct({ id: 999999 })
  console.log('[02] invalid:', r6.result, 'maxLevel:', r6.maxLevel)
  filewrite({ type: 'invalid', result: r6.result, maxLevel: r6.maxLevel, messages: r6.messages }, 'r6-invalid')

  // Test 7: string identifier (via setIdent)
  await api.v1.assembly.setCurrentProduct({ id: asmId }) // reset
  await api.v1.assembly.setIdent({ id: instId, ident: 'myInst' })
  try {
    const r7 = await api.v1.assembly.setCurrentProduct({ id: 'myInst' })
    console.log('[02] string ident:', r7.result, 'maxLevel:', r7.maxLevel)
    filewrite({ type: 'string-ident', result: r7.result, maxLevel: r7.maxLevel, messages: r7.messages }, 'r7-string')
  } catch (e) {
    console.log('[02] string ident error:', e.message)
    filewrite({ type: 'string-ident', error: e.message }, 'r7-string')
  }

  return { asmId, tplId, subAsmTplId, instId, boxFeat }
}
