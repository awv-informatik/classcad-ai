export default async function (api, { snapshot, filewrite }) {
  // Test the safe state transitions in the workflow
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Free',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const results = []

  // Transition 1: start → start (double start without finish)
  const r1a = await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  console.log('[03] start1:', r1a.maxLevel)

  const r1b = await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst], pivotInfo: [0, 0, 0], mucType: 'TRANSLATION_2D',
  })
  console.log('[03] start2 (overwrites start1):', r1b.maxLevel)
  results.push({ transition: 'start→start', maxLevel1: r1a.maxLevel, maxLevel2: r1b.maxLevel })

  // Does the second start's mucType take effect?
  // Move with offset (should work since TRANSLATION_2D is now active)
  await api.v1.assembly.moveUnderConstraints({ id: asmId, offset: [50, 30, 0] })
  const mass1 = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[03] after move (should use TRANSLATION_2D):', mass1.cog)
  results.push({ transition: 'move-after-double-start', cog: mass1.cog })

  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  // Transition 2: start → move → move → finish (multiple moves)
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  await api.v1.assembly.moveUnderConstraints({ id: asmId, offset: [100, 0, 0] })
  await api.v1.assembly.moveUnderConstraints({ id: asmId, offset: [0, 100, 0] })
  const mass2 = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[03] after double move (last should win):', mass2.cog)
  results.push({ transition: 'start→move→move→finish', cog: mass2.cog })
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  // Transition 3: start → finish → start → move → finish (clean restart)
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId }) // no move
  // New session
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  await api.v1.assembly.moveUnderConstraints({ id: asmId, offset: [25, 25, 25] })
  const mass3 = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[03] after clean restart:', mass3.cog)
  results.push({ transition: 'start→finish→start→move→finish', cog: mass3.cog })
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  filewrite(results, 'state-machine')
  return { inst }
}
