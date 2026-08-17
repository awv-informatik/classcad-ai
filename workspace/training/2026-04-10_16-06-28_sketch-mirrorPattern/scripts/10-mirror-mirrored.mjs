// Mirror the mirrored copy (chain mirror): mirror result geometry across a second line
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create geometry in bottom-left
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [5, 5, 0], endPos: [15, 5, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [15, 5, 0], endPos: [15, 15, 0] })).result
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })).result

  // First mirror across vertical at x=25
  const sym1 = (await api.v1.sketch.line({ id: skId, startPos: [25, -5, 0], endPos: [25, 25, 0] })).result
  const r1 = await api.v1.sketch.mirrorPattern({ id: skId, rigidSetId: rsId, symmetryLineId: sym1 })
  console.log('[10] mirror1 geometry:', JSON.stringify(r1.result?.geometry))

  // Now mirror the COPY (geometry[1]) across horizontal at y=25
  // The copy is a rigid set — use it as rigidSetId
  const copyRsId = r1.result?.geometry?.[1]
  console.log('[10] copyRsId:', copyRsId)

  if (copyRsId) {
    const sym2 = (await api.v1.sketch.line({ id: skId, startPos: [-5, 25, 0], endPos: [55, 25, 0] })).result
    const r2 = await api.v1.sketch.mirrorPattern({ id: skId, rigidSetId: copyRsId, symmetryLineId: sym2 })
    console.log('[10] mirror2 result:', JSON.stringify(r2.result))
    console.log('[10] mirror2 maxLevel:', r2.maxLevel)

    filewrite({ mirror1: r1.result, mirror2: r2.result }, 'chained-mirror')
  }

  await snapshot('chained-mirror')
  return { partId }
}
