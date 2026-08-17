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

  // Test: setCurrentProduct returns the PREVIOUS current product
  // So we can use it to detect what setCurrentInstance sets

  // First, ensure we're at the assembly root
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Now setCurrentInstance to inst1 (linked to tpl1=BoxPart)
  await api.v1.assembly.setCurrentInstance({ id: inst1 })

  // Check what current product is now by calling setCurrentProduct back to asmId
  // It returns the PREVIOUS current product
  const rPrev1 = await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[02] After setCurrentInstance(inst1), previous product was:', rPrev1.result)

  // Now setCurrentInstance to inst2 (linked to tpl2=CylPart)
  await api.v1.assembly.setCurrentInstance({ id: inst2 })
  const rPrev2 = await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[02] After setCurrentInstance(inst2), previous product was:', rPrev2.result)

  // Now setCurrentInstance to asmId (root assembly)
  await api.v1.assembly.setCurrentInstance({ id: asmId })
  const rPrev3 = await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[02] After setCurrentInstance(asmId), previous product was:', rPrev3.result)

  // For reference:
  console.log('[02] tpl1 (BoxPart):', tpl1, 'tpl2 (CylPart):', tpl2, 'asmId:', asmId)

  filewrite({
    afterInst1: rPrev1.result,
    afterInst2: rPrev2.result,
    afterAsmId: rPrev3.result,
    tpl1, tpl2, asmId
  }, 'product-tracking')

  return { asmId, tpl1, tpl2, inst1, inst2 }
}
