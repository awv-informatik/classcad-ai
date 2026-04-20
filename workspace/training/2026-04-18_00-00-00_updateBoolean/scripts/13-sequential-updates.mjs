export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SeqTest' })).result

  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Tool', length: 40, width: 40, height: 60, translation: [20, 10, -10] })).result

  const boolId = (await api.v1.part.boolean({
    id: partId, type: 'UNION', name: 'Bool1', target: box1, tools: [box2],
  })).result
  console.log('[13] boolean created:', boolId, 'type: UNION')

  // First update: UNION → SUBTRACTION
  await api.v1.part.openFeature({ id: boolId })
  const r1 = await api.v1.part.updateBoolean({ id: boolId, type: 'SUBTRACTION' })
  console.log('[13] update 1 (SUBTRACTION):', r1.result, 'maxLevel:', r1.maxLevel)
  await api.v1.part.closeFeature({ id: boolId })
  await snapshot('after-subtraction')

  // Second update: SUBTRACTION → INTERSECTION
  await api.v1.part.openFeature({ id: boolId })
  const r2 = await api.v1.part.updateBoolean({ id: boolId, type: 'INTERSECTION' })
  console.log('[13] update 2 (INTERSECTION):', r2.result, 'maxLevel:', r2.maxLevel)
  await api.v1.part.closeFeature({ id: boolId })
  await snapshot('after-intersection')

  // Third update: INTERSECTION → UNION + name change
  await api.v1.part.openFeature({ id: boolId })
  const r3 = await api.v1.part.updateBoolean({ id: boolId, type: 'UNION', name: 'FinalUnion' })
  console.log('[13] update 3 (UNION+name):', r3.result, 'maxLevel:', r3.maxLevel)
  await api.v1.part.closeFeature({ id: boolId })
  await snapshot('after-final-union')

  filewrite({
    update1: { result: r1.result, maxLevel: r1.maxLevel },
    update2: { result: r2.result, maxLevel: r2.maxLevel },
    update3: { result: r3.result, maxLevel: r3.maxLevel },
  }, 'sequential-results')

  return { partId, boolId }
}
