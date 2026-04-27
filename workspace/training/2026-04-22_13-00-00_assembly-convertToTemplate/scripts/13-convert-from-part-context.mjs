export default async function (api, { filewrite }) {
  // What happens if currentProduct is a part template when we call convertToTemplate?
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, length: 40, width: 30, height: 20 })
  // Note: currentProduct is now tplId (the part template), NOT the root

  // Check currentProduct before conversion
  const beforeR = await api.v1.common.getAppVersion({})
  console.log('[13] currentProduct before:', beforeR.structure?.currentProduct)

  // Convert while in part template context
  const r = await api.v1.assembly.convertToTemplate({ name: 'ConvertFromPart' })
  console.log('[13] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[13] messages:', JSON.stringify(r.messages))

  const newRoot = r.structure?.root
  const curProd = r.structure?.currentProduct
  console.log('[13] new root:', newRoot, 'currentProduct after:', curProd)

  filewrite({
    currentProductBefore: beforeR.structure?.currentProduct,
    result: r.result,
    maxLevel: r.maxLevel,
    messages: r.messages,
    newRoot,
    currentProductAfter: curProd,
  }, 'convert-from-part-context')

  return {}
}
