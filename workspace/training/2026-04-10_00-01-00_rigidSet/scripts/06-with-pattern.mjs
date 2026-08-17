// 06 — Use rigid set as input to linearPattern
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PatternTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a small L-shape
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [20, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [20, 0, 0], endPos: [20, 15, 0] })).result

  // Create rigid set from L-shape
  const rs = await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })
  console.log('[06] rigidSet:', rs.result, 'maxLevel:', rs.maxLevel)

  // Use rigid set in linearPattern
  const lp = await api.v1.sketch.linearPattern({
    id: skId,
    rigidSetId: rs.result,
    xCount: 3,
    xDistance: 40
  })
  console.log('[06] linearPattern — result:', lp.result, 'maxLevel:', lp.maxLevel)
  console.log('[06] linearPattern messages:', JSON.stringify(lp.messages))
  filewrite({ result: lp.result, messages: lp.messages, maxLevel: lp.maxLevel }, 'pattern-response')

  await snapshot('linear-pattern')
  return { partId }
}
