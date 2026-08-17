export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'IdentTest' })).result
  console.log('[01] asmId:', asmId)

  // Create a part template with geometry
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  const wcsId = (await api.v1.part.workCSys({
    id: tplId, name: 'WCS1',
    origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result
  console.log('[01] tplId:', tplId, 'wcsId:', wcsId)

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create two instances
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1'
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  console.log('[01] inst1:', inst1, 'inst2:', inst2)

  // Set ident on inst1
  const r1 = await api.v1.assembly.setIdent({ id: inst1, ident: 'my_box_1' })
  console.log('[01] setIdent inst1 result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'setIdent-inst1')

  // Set ident on inst2
  const r2 = await api.v1.assembly.setIdent({ id: inst2, ident: 'my_box_2' })
  console.log('[01] setIdent inst2 result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Now try using the ident string in place of numeric ID
  // Test with getInstance
  const gi1 = await api.v1.assembly.getInstance({ id: 'my_box_1' })
  console.log('[01] getInstance by ident result:', gi1.result ? 'ok' : 'null', 'maxLevel:', gi1.maxLevel)
  filewrite({ result: gi1.result, messages: gi1.messages, maxLevel: gi1.maxLevel }, 'getInstance-by-ident')

  // Test with transformInstance using ident
  const tr = await api.v1.assembly.transformInstance({
    id: 'my_box_1',
    transformation: [[10, 0, 0], [1, 0, 0], [0, 1, 0]]
  })
  console.log('[01] transformInstance by ident result:', tr.result, 'maxLevel:', tr.maxLevel)

  await snapshot('after-ident')

  return { asmId, tplId, inst1, inst2 }
}
