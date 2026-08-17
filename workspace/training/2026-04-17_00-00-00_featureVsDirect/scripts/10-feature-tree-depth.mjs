export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TreeDepthTest' })).result

  // Build a feature chain: box -> fillet -> boolean
  const box1 = (await api.v1.part.box({
    id: partId, name: 'Base', length: 100, width: 80, height: 60,
  })).result

  const box2 = (await api.v1.part.box({
    id: partId, name: 'Tool', length: 30, width: 30, height: 100,
    references: [],
  })).result

  // Feature boolean
  const boolId = (await api.v1.part.boolean({
    id: partId, name: 'CutHole',
    type: 'SUBTRACTION',
    target: box1,
    tools: [box2],
  })).result
  console.log('[10] boolean feature:', boolId)

  // Get the full structure tree
  const r = await api.v1.common.getAppVersion({})
  filewrite(r.structure, 'feature-chain-structure')

  await snapshot('feature-chain')

  // Now same geometry via direct solids
  const partId2 = (await api.v1.part.create({ name: 'DirectEquiv' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId2, name: 'EIF1' })).result

  const sBox1 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 80, height: 60,
  })).result
  const sBox2 = (await api.v1.solid.box({
    id: eifId, length: 30, width: 30, height: 100,
  })).result

  const subR = await api.v1.solid.subtraction({
    id: eifId, target: sBox1, tools: [sBox2],
  })
  console.log('[10] solid subtraction:', subR.result)

  const r2 = await api.v1.common.getAppVersion({})
  filewrite(r2.structure, 'direct-equiv-structure')

  await snapshot('direct-equiv')

  return { partId, partId2 }
}
