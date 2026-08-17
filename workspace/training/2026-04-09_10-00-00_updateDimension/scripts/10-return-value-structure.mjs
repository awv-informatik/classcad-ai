// 10 — Deep inspection of the return value and structure tree after updateDimension
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 40, 0], endPos: [80, 40, 0] })).result
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1, l2], name: 'myDim' })).result
  console.log('[10] dimId:', dimId)

  // Capture full envelope including structure and graphic
  const r = await api.v1.sketch.updateDimension({ id: dimId, value: 75 })
  console.log('[10] result type:', typeof r.result, 'value:', r.result)
  console.log('[10] envelope keys:', Object.keys(r).join(', '))
  console.log('[10] has structure:', !!r.structure)
  console.log('[10] has graphic:', !!r.graphic)
  console.log('[10] messages count:', r.messages?.length ?? 'none')

  // Dump the full envelope (excluding huge structure/graphic)
  filewrite({
    result: r.result,
    resultType: typeof r.result,
    messages: r.messages,
    maxLevel: r.maxLevel,
    hasStructure: !!r.structure,
    hasGraphic: !!r.graphic,
    envelopeKeys: Object.keys(r)
  }, 'full-envelope')

  // Dump structure to see dimension state
  if (r.structure) {
    filewrite(r.structure, 'structure-after-update')
  }

  return { partId }
}
