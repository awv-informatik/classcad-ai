export default async function (api, { snapshot, filewrite }) {
  // Test: use assembly.create, then add a partTemplate with geometry, then instantiate
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  console.log('[05] asmId:', asmId)

  // Create a part template
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  console.log('[05] tplId:', tplId)

  // Build geometry in the template
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Box1', length: 60, width: 40, height: 10 })).result
  console.log('[05] boxId:', boxId)

  // Return to assembly context
  const prevId = (await api.v1.assembly.setCurrentProduct({ id: asmId })).result
  console.log('[05] setCurrentProduct returned (previous):', prevId)

  // Instance it
  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst1' })).result
  console.log('[05] inst1:', inst1)

  // Verify with mass properties
  const mp = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[05] mass props:', JSON.stringify(mp))
  filewrite(mp, 'mass-props-assembly')

  await snapshot('assembly-with-one-instance')
  return { asmId, tplId, inst1 }
}
