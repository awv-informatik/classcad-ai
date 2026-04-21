export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiCCTest' })).result

  const skId = (await api.v1.part.sketch({ id: partId, name: 'Sk1' })).result
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [40, 0, 0], endPos: [40, 30, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [0, 30, 0], endPos: [40, 30, 0] })).result
  const l4 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [0, 30, 0] })).result

  // Create two composite curves from different subsets of the same sketch
  const cc1 = (await api.v1.part.compositeCurve({ id: partId, name: 'CC_Top', references: [l1, l2] })).result
  const cc2 = (await api.v1.part.compositeCurve({ id: partId, name: 'CC_Bottom', references: [l4, l3] })).result

  console.log('[12] cc1:', cc1, 'cc2:', cc2)

  // Can a curve be in multiple composite curves?
  const cc3 = (await api.v1.part.compositeCurve({ id: partId, name: 'CC_Shared', references: [l1, l4] }))
  console.log('[12] shared ref cc3 result:', cc3.result, 'maxLevel:', cc3.maxLevel)
  if (cc3.messages && cc3.messages.length > 0) {
    console.log('[12] cc3 messages:', JSON.stringify(cc3.messages))
  }

  filewrite({
    cc1, cc2,
    cc3: { result: cc3.result, messages: cc3.messages, maxLevel: cc3.maxLevel }
  }, 'multi-cc-responses')

  await snapshot('multiple-composites')
  return { partId, cc1, cc2, cc3: cc3.result }
}
