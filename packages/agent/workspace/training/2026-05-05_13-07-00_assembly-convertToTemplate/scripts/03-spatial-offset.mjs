export default async function (api, { snapshot, filewrite }) {
  // Create assembly with a box template
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 20, height: 10 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance at offset [50, 30, 20]
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId,
    ownerId: asmId,
    name: 'OffsetBlock',
    transformation: [[50, 30, 20], [1, 0, 0], [0, 1, 0]],
  })).result

  // Measure root COG before conversion
  const cogBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] root COG before convert:', JSON.stringify(cogBefore))
  // Expected: box centered at origin in template-local = [20,10,5]
  // With offset [50,30,20] → world COG = [70, 40, 25]

  // Convert the root to template
  await api.v1.assembly.convertToTemplate({ name: 'OffsetSub' })
  const getR = await api.v1.assembly.getAssemblyTemplate({ name: 'OffsetSub' })
  const convertedId = getR.result
  const newRoot = getR.structure?.root
  console.log('[03] convertedId:', convertedId, 'newRoot:', newRoot)

  // Instance the converted template at ANOTHER offset [100, 0, 0]
  const inst2 = (await api.v1.assembly.instance({
    productId: convertedId,
    ownerId: newRoot,
    name: 'DoubleOffset',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Measure the nested instance COG
  // Expected: template-internal offset [50,30,20] + instance offset [100,0,0]
  // = box local [20,10,5] + [50,30,20] + [100,0,0] = [170, 40, 25]
  const cogAfter = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[03] nested instance COG:', JSON.stringify(cogAfter))

  // Also instance at origin to verify template preserves the internal offset
  const inst3 = (await api.v1.assembly.instance({
    productId: convertedId,
    ownerId: newRoot,
    name: 'AtOrigin',
  })).result
  const cogOrigin = (await api.v1.assembly.calculateMassProperties({ id: inst3 })).result
  console.log('[03] at-origin instance COG:', JSON.stringify(cogOrigin))
  // Expected: same as cogBefore = [70, 40, 25]

  await snapshot('offset-test')

  filewrite({
    cogBefore,
    cogAfterOffset: cogAfter,
    cogAtOrigin: cogOrigin,
    predictions: {
      cogBeforeExpected: [70, 40, 25],
      cogAfterOffsetExpected: [170, 40, 25],
      cogAtOriginExpected: [70, 40, 25],
    },
  }, 'offset-verification')

  return { inst2, inst3 }
}
