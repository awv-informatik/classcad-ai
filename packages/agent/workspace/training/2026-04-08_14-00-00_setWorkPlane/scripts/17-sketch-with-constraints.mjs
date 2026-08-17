// Test: setWorkPlane on a sketch with constraints — do constraints survive?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConstraintTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId, name: 'Sk1' })).result

  // Draw two lines and add a constraint
  const l1 = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  const l2 = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [0, 50, 0] })
  console.log('[17] lines:', l1.result, l2.result, 'maxLevels:', l1.maxLevel, l2.maxLevel)

  // Add perpendicular constraint
  const cR = await api.v1.sketch.constraint({
    id: skId,
    type: 'PERPENDICULAR',
    references: [l1.result, l2.result],
  })
  console.log('[17] constraint result:', cR.result, 'maxLevel:', cR.maxLevel)

  await snapshot('before-move')

  // Move to different plane
  const wpId = (await api.v1.part.workPlane({
    id: partId, normal: [0, 0, 1], position: [0, 0, 50],
  })).result

  const r = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpId })
  console.log('[17] setWorkPlane maxLevel:', r.maxLevel)

  await snapshot('after-move')

  // Check if constraint still exists
  const sk = r.structure?.tree?.[''+skId]
  console.log('[17] sketch children count:', sk?.children?.length || 'n/a')

  filewrite({
    maxLevel: r.maxLevel,
    sketchCoordSys: sk?.coordinateSystem,
  }, 'constraints-after-move')

  return { partId }
}
