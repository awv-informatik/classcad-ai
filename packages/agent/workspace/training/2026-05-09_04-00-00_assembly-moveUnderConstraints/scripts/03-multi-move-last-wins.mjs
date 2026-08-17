export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with unconstrained instance
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Wcs', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Free',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[03] COG before:', massBefore.cog)

  // Start a move session
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })

  // Move 1: offset +100 X
  await api.v1.assembly.moveUnderConstraints({ id: asmId, offset: [100, 0, 0] })
  const mass1 = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[03] COG after move1 (+100X):', mass1.cog)

  // Move 2: offset +50 Y (should REPLACE move 1, not add to it)
  await api.v1.assembly.moveUnderConstraints({ id: asmId, offset: [0, 50, 0] })
  const mass2 = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[03] COG after move2 (+50Y, replace):', mass2.cog)

  // Move 3: offset +100X +50Y (explicitly combined)
  await api.v1.assembly.moveUnderConstraints({ id: asmId, offset: [100, 50, 0] })
  const mass3 = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[03] COG after move3 (+100X+50Y):', mass3.cog)

  // Move 4: back to identity (zero offset) — should return to start position
  await api.v1.assembly.moveUnderConstraints({ id: asmId, offset: [0, 0, 0] })
  const mass4 = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[03] COG after move4 (identity):', mass4.cog)

  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  const massEnd = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[03] COG after finish:', massEnd.cog)

  filewrite({
    before: massBefore.cog,
    afterMove1_plus100X: mass1.cog,
    afterMove2_plus50Y_replace: mass2.cog,
    afterMove3_both: mass3.cog,
    afterMove4_identity: mass4.cog,
    afterFinish: massEnd.cog,
  }, 'multi-move-result')

  return { inst }
}
