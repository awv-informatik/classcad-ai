export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TIToTest' })).result

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1'
  })).result

  await api.v1.assembly.setIdent({ id: inst1, ident: 'alpha' })

  // transformInstanceTo takes [[origin], [xDir], [yDir]] format (3 elements)
  const tr = await api.v1.assembly.transformInstanceTo({
    id: 'alpha',
    transformation: [[50, 20, 0], [1, 0, 0], [0, 1, 0]]
  })
  console.log('[06] transformInstanceTo(alpha):', tr.result, 'maxLevel:', tr.maxLevel)
  filewrite({ result: tr.result, messages: tr.messages, maxLevel: tr.maxLevel }, 'transformInstanceTo-ident')

  // Verify with calculateMassProperties (using numeric ID since ident doesn't work there)
  const mp = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  console.log('[06] COG after transformInstanceTo:', mp.result?.centerOfGravity)
  filewrite(mp.result, 'massProps-after-transform')

  await snapshot('transformInstanceTo-ident')

  return { asmId }
}
