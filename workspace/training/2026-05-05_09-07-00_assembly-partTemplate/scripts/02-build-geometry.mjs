export default async function (api, { snapshot, filewrite }) {
  // Create assembly + template
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  console.log('[02] asmId:', asmId, 'tplId:', tplId)

  // Try building geometry using the template ID directly
  const boxR = await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })
  console.log('[02] part.box result:', boxR.result, 'maxLevel:', boxR.maxLevel)

  // Check currentProduct after part.box
  const structInfo = {
    root: boxR.structure?.root,
    currentProduct: boxR.structure?.currentProduct,
    currentInstance: boxR.structure?.currentInstance,
  }
  console.log('[02] structure after part.box:', JSON.stringify(structInfo))

  // Try adding a work coordinate system
  const wcsR = await api.v1.part.workCSys({
    id: tplId,
    name: 'MateCSys',
    origin: [30, 20, 10],
    xDirection: [1, 0, 0],
    yDirection: [0, 1, 0],
  })
  console.log('[02] workCSys result:', wcsR.result, 'maxLevel:', wcsR.maxLevel)

  // Check mass properties of the template directly
  const massR = await api.v1.assembly.calculateMassProperties({ id: tplId })
  console.log('[02] mass properties of template:', JSON.stringify(massR.result))
  console.log('[02] mass maxLevel:', massR.maxLevel)

  filewrite(
    {
      boxId: boxR.result,
      wcsId: wcsR.result,
      structAfterBox: structInfo,
      massProperties: massR.result,
    },
    'build-geometry'
  )

  // Return to assembly context and instantiate
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const instR = await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst1' })
  console.log('[02] instance result:', instR.result, 'maxLevel:', instR.maxLevel)

  await snapshot('after-instance')

  return { asmId, tplId, boxId: boxR.result, wcsId: wcsR.result, instId: instR.result }
}
