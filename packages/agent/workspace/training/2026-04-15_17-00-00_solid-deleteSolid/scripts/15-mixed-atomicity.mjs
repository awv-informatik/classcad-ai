// Definitive test: mixed valid+invalid — are valid IDs deleted or does the whole call fail?
// Use 3 distinctly positioned boxes, try to delete [box1, 99999, box3] — does box2 remain alone, or do all 3 survive?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MixedAtomic' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 50, translation: [80, 0, 0] })).result
  const box3 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 70, translation: [0, 80, 0] })).result
  console.log('[15] box1:', box1, 'box2:', box2, 'box3:', box3)

  await snapshot('before-3boxes')

  // Try to delete [box1, INVALID, box3] — keep box2
  const r = await api.v1.solid.deleteSolid({ id: eifId, ids: [box1, 99999, box3] })
  console.log('[15] mixed delete — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'mixed-atomicity-response')

  await snapshot('after-mixed')

  // Count remaining solids by trying to copy each
  for (const [name, id] of [['box1', box1], ['box2', box2], ['box3', box3]]) {
    const test = await api.v1.solid.copy({ id: eifId, target: id, translation: [200, 200, 0] })
    console.log('[15]', name, '(id', id + ') alive?', test.maxLevel <= 31 ? 'YES' : 'NO (maxLevel=' + test.maxLevel + ')')
    // Clean up successful copies
    if (test.maxLevel <= 31 && test.result) {
      await api.v1.solid.deleteSolid({ id: eifId, ids: [test.result] })
    }
  }

  return { partId, eifId }
}
