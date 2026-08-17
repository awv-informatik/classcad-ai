export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 30, width: 20, height: 15 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1',
  })).result

  // Does transformInstanceTo accept a 4x4 matrix like instance() does?
  // Translate to [40, 20, 0] via 4x4 matrix
  const r1 = await api.v1.assembly.transformInstanceTo({
    id: inst,
    transformation: [
      [1, 0, 0, 40],
      [0, 1, 0, 20],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[08] 4x4 matrix result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, '4x4-response')

  const cog1 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[08] COG after 4x4:', JSON.stringify(cog1?.cog))
  // If accepted as 4x4: COG should be at [40+15, 20+10, 7.5] = [55, 30, 7.5]
  // If rejected or interpreted as 3-point: different result

  // Also try: set back to known position via 3-point format to confirm
  await api.v1.assembly.transformInstanceTo({
    id: inst,
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  const cog2 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[08] COG after reset to origin:', JSON.stringify(cog2?.cog))

  filewrite({
    cogAfter4x4: cog1?.cog,
    cogAfterReset: cog2?.cog,
  }, '4x4-cogs')

  await snapshot('after-4x4')

  return { inst, asmId }
}
