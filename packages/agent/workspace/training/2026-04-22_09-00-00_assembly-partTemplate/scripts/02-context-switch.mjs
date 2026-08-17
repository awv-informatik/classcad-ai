export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  console.log('[02] asmId:', asmId)

  const tplId = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  console.log('[02] tplId:', tplId)

  // Try building geometry inside the template directly (no setCurrentProduct)
  const boxR = await api.v1.part.box({ id: tplId, name: 'Box1', length: 60, width: 40, height: 30 })
  console.log('[02] box result:', boxR.result, 'maxLevel:', boxR.maxLevel)
  console.log('[02] box messages:', JSON.stringify(boxR.messages))

  // Check structure.currentProduct after building
  console.log('[02] currentProduct after box:', boxR.structure?.currentProduct)

  // Add work geometry
  const wcsR = await api.v1.part.workCSys({
    id: tplId,
    name: 'WCS1',
    origin: [0, 0, 0],
    xDirection: [1, 0, 0],
    yDirection: [0, 1, 0],
  })
  console.log('[02] wcs result:', wcsR.result, 'maxLevel:', wcsR.maxLevel)

  await snapshot('box-in-template')

  // Now switch back to assembly
  const prevR = await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[02] setCurrentProduct result:', prevR.result, 'maxLevel:', prevR.maxLevel)
  console.log('[02] currentProduct after switch:', prevR.structure?.currentProduct)

  return { asmId, tplId, boxId: boxR.result, wcsId: wcsR.result }
}
