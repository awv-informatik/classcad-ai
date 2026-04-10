// Test reflex parameter for ANGLE type
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two lines at ~45 degrees
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 40, 0] })).result

  // Normal angle (should be ~45 deg)
  const r1 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line2], reflex: false })
  console.log('[10] ANGLE reflex=false result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Reflex angle (should be ~315 deg)
  const r2 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line2], reflex: true })
  console.log('[10] ANGLE reflex=true result:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    normalAngle: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    reflexAngle: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'reflex-responses')

  await snapshot('reflex-angle')
  return { partId, skId }
}
