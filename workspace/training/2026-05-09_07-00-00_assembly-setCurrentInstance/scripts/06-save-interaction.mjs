export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 40, width: 30, height: 20 })

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'CylPart' })).result
  await api.v1.part.cylinder({ id: tpl2, name: 'Cyl1', height: 30, diameter: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BoxInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'CylInst',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  // Save 1: with current product = root assembly (default)
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const save1 = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result
  console.log('[06] Save with current=asmId: content length:', save1.content?.length)

  // Save 2: with current instance = inst1 (which sets product to tpl1)
  await api.v1.assembly.setCurrentInstance({ id: inst1 })
  const save2 = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result
  console.log('[06] Save with current=inst1: content length:', save2.content?.length)

  // Save 3: with current instance = inst2 (which sets product to tpl2)
  await api.v1.assembly.setCurrentInstance({ id: inst2 })
  const save3 = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result
  console.log('[06] Save with current=inst2: content length:', save3.content?.length)

  filewrite({
    save1_len: save1.content?.length,
    save2_len: save2.content?.length,
    save3_len: save3.content?.length,
    same_content_1_2: save1.content === save2.content,
    same_content_2_3: save2.content === save3.content,
    same_content_1_3: save1.content === save3.content,
  }, 'save-comparison')

  // The docs say setCurrentProduct affects what gets saved.
  // If setCurrentInstance changes the product, then saves should differ.

  return { asmId }
}
