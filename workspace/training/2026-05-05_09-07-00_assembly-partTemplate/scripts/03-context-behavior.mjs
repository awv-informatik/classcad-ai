export default async function (api, { snapshot, filewrite }) {
  // Create assembly
  const asmId = (await api.v1.assembly.create({ name: 'CtxTest' })).result
  console.log('[03] asmId:', asmId)

  // Get currentProduct before partTemplate
  const pre = await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[03] currentProduct before partTemplate (setCP returns prev):', pre.result)

  // Create template — check if it switches context
  const tplR = await api.v1.assembly.partTemplate({ name: 'A' })
  const tplId = tplR.result
  console.log('[03] tplId:', tplId, 'currentProduct after partTemplate:', tplR.structure?.currentProduct)

  // Now try another assembly call (instance) WITHOUT setCurrentProduct back
  // This should work if context is still assembly
  const inst1R = await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'I1' })
  console.log('[03] instance WITHOUT setCurrentProduct back - result:', inst1R.result, 'maxLevel:', inst1R.maxLevel)
  console.log('[03] currentProduct after instance:', inst1R.structure?.currentProduct)

  // Now call part.box on template — does it switch context?
  const boxR = await api.v1.part.box({ id: tplId, name: 'Box', length: 40, width: 30, height: 20 })
  console.log('[03] part.box result:', boxR.result, 'currentProduct after part.box:', boxR.structure?.currentProduct)

  // Try assembly.instance now (without setCurrentProduct back to asm)
  const inst2R = await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'I2' })
  console.log('[03] instance after part.box (no setCP) - result:', inst2R.result, 'maxLevel:', inst2R.maxLevel)
  if (inst2R.messages?.length > 0) {
    console.log('[03] instance messages:', JSON.stringify(inst2R.messages))
  }

  filewrite(
    {
      currentProductAfterPartTemplate: tplR.structure?.currentProduct,
      instanceWithoutSetCP: { result: inst1R.result, maxLevel: inst1R.maxLevel },
      currentProductAfterBox: boxR.structure?.currentProduct,
      instanceAfterBox: { result: inst2R.result, maxLevel: inst2R.maxLevel, messages: inst2R.messages },
    },
    'context-behavior'
  )

  return { asmId, tplId }
}
