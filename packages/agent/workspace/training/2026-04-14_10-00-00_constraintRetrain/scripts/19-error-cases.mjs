// Test: error cases — wrong geomIds count, wrong geometry type, invalid type
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'ErrorTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 30, 0] })).result
  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [80, 20, 0], radius: 15 })).result

  const results = {}

  // 1. PARALLEL with only one line (needs two)
  const r1 = await api.v1.sketch.constraint({ id: skId, type: 'PARALLEL', geomIds: [lineId] })
  console.log('[19] PARALLEL 1 line:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[19] messages:', JSON.stringify(r1.messages))
  results.parallelOneLine = { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }

  // 2. HORIZONTAL on a circle (should fail?)
  const r2 = await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [circId] })
  console.log('[19] HORIZONTAL on circle:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[19] messages:', JSON.stringify(r2.messages))
  results.horizOnCircle = { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }

  // 3. Invalid constraint type
  const r3 = await api.v1.sketch.constraint({ id: skId, type: 'NONEXISTENT', geomIds: [lineId] })
  console.log('[19] NONEXISTENT type:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[19] messages:', JSON.stringify(r3.messages))
  results.invalidType = { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }

  // 4. Empty geomIds
  const r4 = await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [] })
  console.log('[19] empty geomIds:', r4.result, 'maxLevel:', r4.maxLevel)
  if (r4.messages?.length) console.log('[19] messages:', JSON.stringify(r4.messages))
  results.emptyGeomIds = { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages }

  // 5. EQUAL_LENGTH line + circle (mismatched geometry)
  const r5 = await api.v1.sketch.constraint({ id: skId, type: 'EQUAL_LENGTH', geomIds: [lineId, circId] })
  console.log('[19] EQUAL_LENGTH line+circle:', r5.result, 'maxLevel:', r5.maxLevel)
  if (r5.messages?.length) console.log('[19] messages:', JSON.stringify(r5.messages))
  results.eqLenMismatch = { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages }

  filewrite(results, 'error-cases')

  return { partId }
}
