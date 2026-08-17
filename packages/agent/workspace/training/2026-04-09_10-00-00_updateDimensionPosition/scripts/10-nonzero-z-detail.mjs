// Investigate non-zero Z failure more carefully
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]] })).result

  // First set a known position
  await api.v1.sketch.updateDimensionPosition({ id: dimId, pos: [40, 25, 0] })

  // Try various Z values
  const zTests = [0.001, 1, -1, 50, 0]
  const results = []
  for (const z of zTests) {
    const r = await api.v1.sketch.updateDimensionPosition({ id: dimId, pos: [40, 25, z] })
    const node = r.structure?.tree?.[String(dimId)]
    const dimPt = node?.members?.dimPt?.value
    console.log(`[10] Z=${z} → result:${r.result} maxLevel:${r.maxLevel} dimPt:${JSON.stringify(dimPt)} msgs:${JSON.stringify(r.messages)}`)
    results.push({ z, result: r.result, maxLevel: r.maxLevel, dimPt, messages: r.messages })
  }

  filewrite(results, 'z-values')
  return {}
}
