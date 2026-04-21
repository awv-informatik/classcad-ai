export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OpenFeatureTest' })).result
  console.log('[05] partId:', partId)

  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40, name: 'Box1' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 20, height: 60, position: [30, 0, 0], name: 'Cyl1' })).result
  console.log('[05] boxId:', boxId, 'cylId:', cylId)

  // Move bar before cylinder, then try to openFeature on the rolled-back cylinder
  await api.v1.part.operationMoveBefore({ id: partId, featureId: cylId })

  const r1 = await api.v1.part.openFeature({ id: cylId })
  console.log('[05] openFeature(rolledBack cyl) result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'open-rolledback')

  if (r1.maxLevel <= 31) {
    // If it succeeded, close it
    await api.v1.part.closeFeature({ id: cylId })
  }

  // Try openFeature on box (which IS visible)
  const r2 = await api.v1.part.openFeature({ id: boxId })
  console.log('[05] openFeature(visible box) result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'open-visible')

  if (r2.maxLevel <= 31) {
    // Update it while bar is in middle
    const r3 = await api.v1.part.updateBox({ id: boxId, height: 100 })
    console.log('[05] updateBox result:', r3.result, 'maxLevel:', r3.maxLevel)
    await api.v1.part.closeFeature({ id: boxId })
    await snapshot('updated-box-midbar')
  }

  // Move to end
  await api.v1.part.operationMoveToEnd({ id: partId })
  await snapshot('restored')

  // Now try: openFeature while bar is at end
  const r4 = await api.v1.part.openFeature({ id: boxId })
  console.log('[05] openFeature(box at end) result:', r4.result, 'maxLevel:', r4.maxLevel)

  // Does openFeature move the bar automatically?
  const rStr = await api.v1.common.recalc()
  const ops = rStr.structure.tree['18']
  const barIdx = ops.children.indexOf(20)
  console.log('[05] bar position after openFeature:', barIdx, 'of', ops.children.length)
  console.log('[05] children:', JSON.stringify(ops.children))

  await api.v1.part.closeFeature({ id: boxId })

  return { partId }
}
