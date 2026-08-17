// 10 — Calling splitAllCurves twice without mergeBack. Does the second call error or reset?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitDouble' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  const line = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result
  console.log('[10] circle:', circle, 'line:', line)

  // First call
  const r1 = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[10] first call result:', JSON.stringify(r1.result))
  console.log('[10] first call maxLevel:', r1.maxLevel)

  // Second call without mergeBack
  const r2 = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[10] second call result:', JSON.stringify(r2.result))
  console.log('[10] second call maxLevel:', r2.maxLevel)
  console.log('[10] same results?', JSON.stringify(r1.result) === JSON.stringify(r2.result))

  filewrite({ first: { result: r1.result, maxLevel: r1.maxLevel }, second: { result: r2.result, maxLevel: r2.maxLevel } }, 'double-call')
  return { partId }
}
