export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with one template, TWO instances at distinct positions
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 30, width: 20, height: 15 })
  // Add a WCS for mate reference
  await api.v1.part.workCSys({ id: tplId, name: 'WCS1', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await snapshot('before')

  // Measure per-instance COG BEFORE transform
  // Use part.calculateMassProperties on the template to get local COG
  const tplMass = (await api.v1.part.calculateMassProperties({ id: tplId })).result
  console.log('[02] template local COG:', JSON.stringify(tplMass?.cog))
  console.log('[02] template volume:', tplMass?.volume)

  // Assembly-level mass properties
  const asmMassBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[02] assembly COG before:', JSON.stringify(asmMassBefore?.cog))
  console.log('[02] assembly volume before:', asmMassBefore?.volume)

  // Transform ONLY inst1 by [0, 50, 0]
  const r = await api.v1.assembly.transformInstance({
    id: inst1,
    transformation: [
      [1, 0, 0, 0],
      [0, 1, 0, 50],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[02] transformInstance result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('after-transform-inst1')

  // Assembly-level mass properties after
  const asmMassAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[02] assembly COG after:', JSON.stringify(asmMassAfter?.cog))
  console.log('[02] assembly volume after:', asmMassAfter?.volume)

  filewrite({
    inst1, inst2,
    templateCOG: tplMass?.cog,
    asmCOGBefore: asmMassBefore?.cog,
    asmCOGAfter: asmMassAfter?.cog,
    asmVolumeBefore: asmMassBefore?.volume,
    asmVolumeAfter: asmMassAfter?.volume,
  }, 'results')

  return { asmId, tplId, inst1, inst2 }
}
