// Test: update built-in axes (XAxis/YAxis/ZAxis) — geometry and name
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const xAxis = (await api.v1.part.getWorkGeometry({ id: partId, name: 'XAxis' })).result
  const yAxis = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result
  console.log('[04] XAxis:', xAxis, 'YAxis:', yAxis)

  // Try to update XAxis geometry (direction)
  await api.v1.part.openFeature({ id: xAxis })
  const r1 = await api.v1.part.updateWorkAxis({ id: xAxis, direction: [1, 1, 0] })
  console.log('[04] update XAxis direction result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[04] messages:', JSON.stringify(r1.messages))
  await api.v1.part.closeFeature({ id: xAxis })

  // Try to rename XAxis
  await api.v1.part.openFeature({ id: xAxis })
  const r2 = await api.v1.part.updateWorkAxis({ id: xAxis, name: 'MyXAxis' })
  console.log('[04] rename XAxis result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[04] rename messages:', JSON.stringify(r2.messages))
  await api.v1.part.closeFeature({ id: xAxis })

  // Check if rename took effect
  const findOld = await api.v1.part.getWorkGeometry({ id: partId, name: 'XAxis' })
  const findNew = await api.v1.part.getWorkGeometry({ id: partId, name: 'MyXAxis' })
  console.log('[04] find XAxis:', findOld.result, 'find MyXAxis:', findNew.result)

  filewrite({
    updateDir: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    rename: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    findOld: findOld.result,
    findNew: findNew.result
  }, 'builtin-responses')

  return { partId }
}
