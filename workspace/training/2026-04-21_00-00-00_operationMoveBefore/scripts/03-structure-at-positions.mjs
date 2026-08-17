export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'StructureTest' })).result
  console.log('[03] partId:', partId)

  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40, name: 'MyBox' })).result
  console.log('[03] boxId:', boxId)

  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 20, height: 60, position: [30, 0, 0], name: 'MyCyl' })).result
  console.log('[03] cylId:', cylId)

  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'MyWP', origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result
  console.log('[03] wpId:', wpId)

  // Structure at end (all features)
  const rEnd = await api.v1.common.recalc()
  filewrite(rEnd.structure, 'structure-all')

  // Move before cylinder — should show only box in structure
  await api.v1.part.operationMoveBefore({ id: partId, featureId: cylId })
  const rMid = await api.v1.common.recalc()
  filewrite(rMid.structure, 'structure-before-cyl')

  // Move before box — empty
  await api.v1.part.operationMoveBefore({ id: partId, featureId: boxId })
  const rStart = await api.v1.common.recalc()
  filewrite(rStart.structure, 'structure-before-box')

  // Restore
  await api.v1.part.operationMoveToEnd({ id: partId })

  return { partId }
}
