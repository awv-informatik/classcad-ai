export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result

  // Create box with a known name
  const boxId = (await api.v1.part.box({ id: partId, name: 'TestBox' })).result
  console.log('[13] boxId:', boxId)

  // Verify initial name works
  const r1 = await api.v1.part.getFeature({ id: partId, name: 'TestBox' })
  console.log('[13] initial "TestBox":', r1.result)

  // Use updateBox to change name
  const upR = await api.v1.part.updateBox({ id: boxId, name: 'BoxRenamed' })
  console.log('[13] updateBox result:', upR.result, 'maxLevel:', upR.maxLevel)

  // Check structure to see what name the box actually has now
  filewrite(upR.structure, 'structure-after-updateBox')

  // Check both names
  const r2 = await api.v1.part.getFeature({ id: partId, name: 'TestBox' })
  const r3 = await api.v1.part.getFeature({ id: partId, name: 'BoxRenamed' })
  console.log('[13] after updateBox "TestBox":', r2.result)
  console.log('[13] after updateBox "BoxRenamed":', r3.result)

  // Now try setObjectName
  await api.v1.common.setObjectName({ id: boxId, name: 'SetObjName' })
  const r4 = await api.v1.part.getFeature({ id: partId, name: 'TestBox' })
  const r5 = await api.v1.part.getFeature({ id: partId, name: 'BoxRenamed' })
  const r6 = await api.v1.part.getFeature({ id: partId, name: 'SetObjName' })
  console.log('[13] after setObjectName "TestBox":', r4.result)
  console.log('[13] after setObjectName "BoxRenamed":', r5.result)
  console.log('[13] after setObjectName "SetObjName":', r6.result)

  filewrite({
    initial: r1.result,
    afterUpdateBox_old: r2.result,
    afterUpdateBox_new: r3.result,
    afterSetObj_old1: r4.result,
    afterSetObj_old2: r5.result,
    afterSetObj_new: r6.result,
  }, 'rename-comparison')

  return { partId }
}
