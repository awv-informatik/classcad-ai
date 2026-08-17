export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with an instance
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Free',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const results = []

  // SKIP bad-ID and move-without-start tests — both cause worker hang

  // Test 1: id-only move (no rotation, no offset)
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  const r1 = await api.v1.assembly.moveUnderConstraints({ id: asmId })
  const mass1 = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  results.push({ test: 'id-only-no-params', maxLevel: r1.maxLevel, result: r1.result, cog: mass1.cog })
  console.log('[05] id-only: maxLevel=', r1.maxLevel, 'COG:', mass1.cog)

  // Test 2: negative offset values
  const r2 = await api.v1.assembly.moveUnderConstraints({ id: asmId, offset: [-100, -200, -300] })
  const mass2 = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  results.push({ test: 'negative-offset', maxLevel: r2.maxLevel, cog: mass2.cog })
  console.log('[05] negative offset COG:', mass2.cog)

  // Test 3: very large offset
  const r3 = await api.v1.assembly.moveUnderConstraints({ id: asmId, offset: [1e6, 1e6, 1e6] })
  const mass3 = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  results.push({ test: 'huge-offset', maxLevel: r3.maxLevel, cog: mass3.cog })
  console.log('[05] huge offset COG:', mass3.cog)

  // Test 4: identity rotation (explicit) — should be no-op
  const r4 = await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [1, 0, 0], yDir: [0, 1, 0], zDir: [0, 0, 1] },
    offset: [0, 0, 0],
  })
  const mass4 = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  results.push({ test: 'identity-explicit', maxLevel: r4.maxLevel, cog: mass4.cog })
  console.log('[05] identity explicit COG:', mass4.cog)

  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  filewrite(results, 'move-errors-result')
  return { inst }
}
