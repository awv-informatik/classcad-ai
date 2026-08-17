export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EITest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  // Create direct solids
  const box1Id = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result
  const box2Id = (await api.v1.solid.box({ id: eifId, length: 20, width: 20, height: 20, translation: [60, 0, 0] })).result
  console.log('[09] partId:', partId, 'eifId:', eifId, 'box1Id:', box1Id, 'box2Id:', box2Id)

  // Test with part ID (should sum both solids)
  const rPart = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[09] part result:', JSON.stringify(rPart.result))
  console.log('[09] part maxLevel:', rPart.maxLevel)

  // Test with solid ID (docs say "solid" is accepted)
  const rSolid1 = await api.v1.part.calculateMassProperties({ id: box1Id })
  console.log('[09] solid1 result:', JSON.stringify(rSolid1.result))
  console.log('[09] solid1 maxLevel:', rSolid1.maxLevel)

  const rSolid2 = await api.v1.part.calculateMassProperties({ id: box2Id })
  console.log('[09] solid2 result:', JSON.stringify(rSolid2.result))
  console.log('[09] solid2 maxLevel:', rSolid2.maxLevel)

  // Test with entity injection feature ID (should fail per the accepted types)
  const rEif = await api.v1.part.calculateMassProperties({ id: eifId })
  console.log('[09] eifId result:', JSON.stringify(rEif.result))
  console.log('[09] eifId maxLevel:', rEif.maxLevel)
  console.log('[09] eifId messages:', JSON.stringify(rEif.messages))

  filewrite({
    part: { result: rPart.result, maxLevel: rPart.maxLevel },
    solid1: { result: rSolid1.result, maxLevel: rSolid1.maxLevel, messages: rSolid1.messages },
    solid2: { result: rSolid2.result, maxLevel: rSolid2.maxLevel, messages: rSolid2.messages },
    eif: { result: rEif.result, maxLevel: rEif.maxLevel, messages: rEif.messages },
  }, 'entity-injection')

  // box1: 40*30*20 = 24000, cog=[20,15,10]
  // box2: 20*20*20 = 8000, cog=[70,10,10] (translation [60,0,0])
  console.log('[09] expected vol1:', 24000, 'vol2:', 8000, 'total:', 32000)

  await snapshot('entity-injection')
  return { partId }
}
