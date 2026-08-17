// Test ANGLEOX dimension type — angle from OX axis
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line at ~45 degrees
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 50, 0] })).result
  console.log('[05] line1:', line1)

  // Create a line at ~30 degrees
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 30, 0], endPos: [60, 64.64, 0] })).result
  console.log('[05] line2:', line2)

  // ANGLEOX on a single line — angle relative to X axis
  const r1 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLEOX', geomIds: [line1] })
  console.log('[05] ANGLEOX line1 result:', r1.result, 'maxLevel:', r1.maxLevel)

  // ANGLEOX on second line
  const r2 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLEOX', geomIds: [line2] })
  console.log('[05] ANGLEOX line2 result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Try ANGLEOX with explicit value
  const r3 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLEOX', geomIds: [line1], value: '30deg' })
  console.log('[05] ANGLEOX explicit result:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    angleox1: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    angleox2: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    angleoxExplicit: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'angleox-responses')

  await snapshot('angleox-dims')
  return { partId, skId }
}
