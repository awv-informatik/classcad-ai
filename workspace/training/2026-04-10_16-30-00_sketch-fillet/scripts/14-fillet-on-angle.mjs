// Test fillet on two lines meeting at a non-90-degree angle
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletAngle' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two lines meeting at 45 degrees
  const l1 = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })
  const l2 = await api.v1.sketch.line({ id: skId, startPos: [60, 0, 0], endPos: [90, 40, 0] })
  console.log('[14] line1:', l1.result, 'line2:', l2.result)

  await snapshot('before-angle-fillet')

  const r = await api.v1.sketch.fillet({ id: skId, lineIds: [l1.result, l2.result], radius: 10 })
  console.log('[14] angle fillet result:', JSON.stringify(r.result))
  console.log('[14] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'angle-fillet-response')
  await snapshot('after-angle-fillet')

  return { partId }
}
