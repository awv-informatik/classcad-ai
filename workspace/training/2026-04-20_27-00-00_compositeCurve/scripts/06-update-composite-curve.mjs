export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateCCTest' })).result

  // Create sketch with 3 lines
  const skId = (await api.v1.part.sketch({ id: partId, name: 'Sk1' })).result
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [40, 0, 0], endPos: [40, 30, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [40, 30, 0], endPos: [70, 30, 0] })).result

  console.log('[06] lines:', l1, l2, l3)

  // Create composite curve with only first two lines
  const ccId = (await api.v1.part.compositeCurve({ id: partId, name: 'CC_Update', references: [l1, l2] })).result
  console.log('[06] initial ccId:', ccId)

  await snapshot('before-update')

  // Now update: open → update → close
  await api.v1.part.openFeature({ id: ccId })
  const r = await api.v1.part.updateCompositeCurve({ id: ccId, references: [l1, l2, l3] })
  console.log('[06] updateCompositeCurve result:', r.result)
  console.log('[06] maxLevel:', r.maxLevel)
  if (r.messages && r.messages.length > 0) {
    console.log('[06] messages:', JSON.stringify(r.messages))
  }
  await api.v1.part.closeFeature({ id: ccId })

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-response')

  await snapshot('after-update')
  return { partId, ccId }
}
