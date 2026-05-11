export default async function (api, { snapshot, filewrite }) {
  // Create assembly with a box template (60x40x30, COG at local [30,20,15])
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({})).result
  await api.v1.part.box({ id: tplId, name: 'Box1', length: 60, width: 40, height: 30 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance 1 at origin
  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst1' })).result

  // Instance 2 offset by [100, 0, 0]
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst2',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Measure individual instances
  const r1 = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  const r2 = await api.v1.assembly.calculateMassProperties({ id: inst2 })
  console.log('[02] inst1 COG:', JSON.stringify(r1.result.cog), 'vol:', r1.result.volume)
  console.log('[02] inst2 COG:', JSON.stringify(r2.result.cog), 'vol:', r2.result.volume)

  // Measure assembly root (should aggregate both instances)
  const rAsm = await api.v1.assembly.calculateMassProperties({ id: asmId })
  console.log('[02] asm COG:', JSON.stringify(rAsm.result.cog), 'vol:', rAsm.result.volume)

  // Expected:
  // inst1 COG: (30, 20, 15) — at origin
  // inst2 COG: (130, 20, 15) — offset by 100 in X
  // asm COG: ((30+130)/2, 20, 15) = (80, 20, 15) — equal volumes, so simple average
  // asm volume: 72000 * 2 = 144000

  const expectedAsmCogX = (r1.result.cog.x + r2.result.cog.x) / 2
  console.log('[02] expected asm COG.x:', expectedAsmCogX, 'actual:', rAsm.result.cog.x, 'match:', Math.abs(expectedAsmCogX - rAsm.result.cog.x) < 0.01)
  console.log('[02] expected asm vol:', r1.result.volume + r2.result.volume, 'actual:', rAsm.result.volume, 'match:', rAsm.result.volume === r1.result.volume + r2.result.volume)

  filewrite({
    inst1: r1.result,
    inst2: r2.result,
    assembly: rAsm.result,
    checks: {
      inst2CogXExpected: 130,
      asmCogXExpected: expectedAsmCogX,
      asmVolExpected: r1.result.volume + r2.result.volume,
    },
  }, 'multi-instance-results')

  await snapshot('multi-instance')
  return { asmId }
}
