// Test constraint rendering: geometry + explicit constraints + dimensions
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Rectangle-ish shape with explicit constraints
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [60, 0, 0], endPos: [60, 40, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [60, 40, 0], endPos: [0, 40, 0] })).result
  const l4 = (await api.v1.sketch.line({ id: skId, startPos: [0, 40, 0], endPos: [0, 0, 0] })).result
  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [30, 20, 0], radius: 8 })).result

  // Add explicit constraints (NOT auto — these should show up as badges)
  await api.v1.sketch.constraint({ id: skId, type: 'PERPENDICULAR', geomIds: [l1, l2] })
  await api.v1.sketch.constraint({ id: skId, type: 'PARALLEL', geomIds: [l1, l3] })
  await api.v1.sketch.constraint({ id: skId, type: 'EQUAL_LENGTH', geomIds: [l2, l4] })

  // Add some dimensions too
  await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1] })
  await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l2] })
  await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [c1] })

  console.log('[10] geometry + constraints + dimensions created')
  await snapshot('constrained')

  return { partId }
}
