export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoOpenTest' })).result

  const skId = (await api.v1.part.sketch({ id: partId, name: 'Sk1' })).result
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [50, 0, 0], endPos: [50, 30, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [50, 30, 0], endPos: [80, 30, 0] })).result

  const ccId = (await api.v1.part.compositeCurve({ id: partId, name: 'CC1', references: [l1, l2] })).result
  console.log('[10] ccId:', ccId)

  // Try update WITHOUT open/close — should fail or produce warning
  const r = await api.v1.part.updateCompositeCurve({ id: ccId, references: [l1, l2, l3] })
  console.log('[10] update without open result:', r.result)
  console.log('[10] maxLevel:', r.maxLevel)
  if (r.messages && r.messages.length > 0) {
    console.log('[10] messages:', JSON.stringify(r.messages))
  }

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'no-open-response')

  return { partId, ccId }
}
