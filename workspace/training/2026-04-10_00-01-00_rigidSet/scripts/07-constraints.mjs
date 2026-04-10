// 07 — Does creating a rigid set add constraints? Check constraint count before/after
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConstraintCheck' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two lines (not connected)
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [60, 20, 0], endPos: [100, 20, 0] })).result

  // Count constraints before rigid set
  const gBefore = await api.v1.sketch.getGeometry({ id: skId })
  const constraintsBefore = gBefore.result.constraints || []
  console.log('[07] constraints before rigidSet:', constraintsBefore.length)
  filewrite({ constraints: constraintsBefore }, 'constraints-before')

  // Create rigid set
  const rs = await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })
  console.log('[07] rigidSet:', rs.result)

  // Count constraints after rigid set
  const gAfter = await api.v1.sketch.getGeometry({ id: skId })
  const constraintsAfter = gAfter.result.constraints || []
  console.log('[07] constraints after rigidSet:', constraintsAfter.length)
  filewrite({ constraints: constraintsAfter }, 'constraints-after')

  // Check if the rigid set changed constraint count
  console.log('[07] new constraints added:', constraintsAfter.length - constraintsBefore.length)

  await snapshot('constraints')
  return { partId }
}
