export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  console.log('[06] asmId:', asmId)
  console.log('[06] currentProduct after create:', (await api.v1.assembly.setCurrentProduct({ id: asmId })).structure?.currentProduct)

  // Create template with geometry
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
  console.log('[06] tplId:', tplId)

  await api.v1.part.box({ id: tplId, name: 'Base', length: 80, width: 40, height: 10 })
  await api.v1.part.box({ id: tplId, name: 'Wall', length: 10, width: 40, height: 50 })

  // Add WCS for constraint anchoring
  const wcsId = (await api.v1.part.workCSys({
    id: tplId,
    name: 'AnchorCSys',
    origin: [0, 0, 0],
    xDirection: [1, 0, 0],
    yDirection: [0, 1, 0],
  })).result
  console.log('[06] wcsId:', wcsId)

  // Switch back to assembly context
  const prevR = await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[06] prev currentProduct:', prevR.result)
  console.log('[06] currentProduct now:', prevR.structure?.currentProduct)

  // Instantiate the template
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId,
    ownerId: asmId,
    name: 'Bracket_1',
  })).result
  console.log('[06] inst1:', inst1)

  const inst2 = (await api.v1.assembly.instance({
    productId: tplId,
    ownerId: asmId,
    name: 'Bracket_2',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[06] inst2:', inst2)

  await snapshot('two-instances')

  // Verify instances
  const instNode1 = (await api.v1.assembly.getInstance({ ownerId: asmId, name: 'Bracket_1' }))
  console.log('[06] getInstance Bracket_1:', instNode1.result)
  const instNode2 = (await api.v1.assembly.getInstance({ ownerId: asmId, name: 'Bracket_2' }))
  console.log('[06] getInstance Bracket_2:', instNode2.result)

  return { asmId, tplId, inst1, inst2 }
}
