export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with unconstrained instance
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Free',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[01] COG before:', massBefore.cog)

  // Move instance
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  await api.v1.assembly.moveUnderConstraints({ id: asmId, offset: [50, 30, 0] })

  const massAfterMove = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[01] COG after move:', massAfterMove.cog)

  // First finish
  const r1 = await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  console.log('[01] finish1: result=', r1.result, 'maxLevel=', r1.maxLevel)
  const massAfterFinish1 = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[01] COG after finish1:', massAfterFinish1.cog)

  // Second finish (no start, no move)
  const r2 = await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  console.log('[01] finish2: result=', r2.result, 'maxLevel=', r2.maxLevel)
  const massAfterFinish2 = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[01] COG after finish2:', massAfterFinish2.cog)

  filewrite({
    before: massBefore.cog,
    afterMove: massAfterMove.cog,
    afterFinish1: massAfterFinish1.cog,
    afterFinish2: massAfterFinish2.cog,
    finish1Result: { result: r1.result, maxLevel: r1.maxLevel },
    finish2Result: { result: r2.result, maxLevel: r2.maxLevel },
    positionStable: JSON.stringify(massAfterFinish1.cog) === JSON.stringify(massAfterFinish2.cog),
  }, 'double-finish-result')

  return { inst }
}
