// 10 — Error cases: invalid IDs, wrong types
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 20, 0] })).result

  // 1. Pass part ID instead of sketch ID
  const r1 = await api.v1.sketch.moveGeometry({ id: partId, geomIds: [lineId], translation: [10, 10, 0] })
  console.log('[10] wrong sketch id - result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[10] wrong sketch id - messages:', JSON.stringify(r1.messages))

  // 2. Pass invalid geomId
  const r2 = await api.v1.sketch.moveGeometry({ id: skId, geomIds: [99999], translation: [10, 10, 0] })
  console.log('[10] invalid geomId - result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[10] invalid geomId - messages:', JSON.stringify(r2.messages))

  // 3. Empty geomIds array
  const r3 = await api.v1.sketch.moveGeometry({ id: skId, geomIds: [], translation: [10, 10, 0] })
  console.log('[10] empty geomIds - result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[10] empty geomIds - messages:', JSON.stringify(r3.messages))

  // 4. Pass sketch ID in geomIds (wrong type)
  const r4 = await api.v1.sketch.moveGeometry({ id: skId, geomIds: [skId], translation: [10, 10, 0] })
  console.log('[10] sketch in geomIds - result:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[10] sketch in geomIds - messages:', JSON.stringify(r4.messages))

  filewrite({
    wrongSketchId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    invalidGeomId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    emptyGeomIds: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    sketchInGeomIds: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'error-cases')

  return { partId }
}
