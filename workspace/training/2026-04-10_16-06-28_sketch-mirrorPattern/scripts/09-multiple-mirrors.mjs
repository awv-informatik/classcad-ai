// Multiple mirror operations: mirror the same geometry across two different lines
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a small L-shape in the bottom-left
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [5, 5, 0], endPos: [15, 5, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [15, 5, 0], endPos: [15, 15, 0] })).result
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })).result

  // First mirror: across vertical line at x=25
  const sym1 = (await api.v1.sketch.line({ id: skId, startPos: [25, -5, 0], endPos: [25, 25, 0] })).result
  const r1 = await api.v1.sketch.mirrorPattern({ id: skId, rigidSetId: rsId, symmetryLineId: sym1 })
  console.log('[09] mirror1 result:', JSON.stringify(r1.result))
  console.log('[09] mirror1 maxLevel:', r1.maxLevel)

  await snapshot('after-first-mirror')

  // Second mirror: mirror the ORIGINAL again across horizontal line at y=25
  const sym2 = (await api.v1.sketch.line({ id: skId, startPos: [-5, 25, 0], endPos: [55, 25, 0] })).result
  const r2 = await api.v1.sketch.mirrorPattern({ id: skId, rigidSetId: rsId, symmetryLineId: sym2 })
  console.log('[09] mirror2 result:', JSON.stringify(r2.result))
  console.log('[09] mirror2 maxLevel:', r2.maxLevel)

  filewrite({ mirror1: r1.result, mirror2: r2.result }, 'multiple-mirrors')

  await snapshot('after-second-mirror')
  return { partId }
}
