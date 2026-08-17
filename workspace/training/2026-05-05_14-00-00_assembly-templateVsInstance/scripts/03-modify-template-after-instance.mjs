export default async function (api, { snapshot, filewrite }) {
  // Test: modify template after instances exist — does geometry update?
  const asmId = (await api.v1.assembly.create({ name: 'ModifyTest' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1'
  })).result

  // Measure instance BEFORE modification
  const massBefore = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  console.log('[03] BEFORE — inst1 COG:', JSON.stringify(massBefore.result?.cog))
  console.log('[03] BEFORE — inst1 volume:', massBefore.result?.volume)

  await snapshot('before-modify')

  // Now modify the template: change box dimensions via openFeature → updateBox → closeFeature
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.openFeature({ id: boxId })
  const updateR = await api.v1.part.updateBox({ id: boxId, length: 120, width: 80, height: 20 })
  console.log('[03] updateBox maxLevel:', updateR.maxLevel)
  await api.v1.part.closeFeature({ id: boxId })
  await api.v1.common.recalc({})

  // Measure template after modification
  const massTplAfter = await api.v1.assembly.calculateMassProperties({ id: tplId })
  console.log('[03] AFTER — template COG:', JSON.stringify(massTplAfter.result?.cog))
  console.log('[03] AFTER — template volume:', massTplAfter.result?.volume)

  // Measure instance after template modification
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const massAfter = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  console.log('[03] AFTER — inst1 COG:', JSON.stringify(massAfter.result?.cog))
  console.log('[03] AFTER — inst1 volume:', massAfter.result?.volume)

  await snapshot('after-modify')

  filewrite({
    before: { instanceCOG: massBefore.result?.cog, instanceVolume: massBefore.result?.volume },
    after: { templateCOG: massTplAfter.result?.cog, templateVolume: massTplAfter.result?.volume, instanceCOG: massAfter.result?.cog, instanceVolume: massAfter.result?.volume }
  }, 'modify-comparison')

  // Also create a NEW instance after the modification to see if it gets the updated geometry
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst2AfterModify',
    transformation: [[150, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  const massInst2 = await api.v1.assembly.calculateMassProperties({ id: inst2 })
  console.log('[03] inst2 (after modify) COG:', JSON.stringify(massInst2.result?.cog))
  console.log('[03] inst2 (after modify) volume:', massInst2.result?.volume)

  await snapshot('new-instance-after-modify')

  return { asmId, tplId, inst1, inst2 }
}
