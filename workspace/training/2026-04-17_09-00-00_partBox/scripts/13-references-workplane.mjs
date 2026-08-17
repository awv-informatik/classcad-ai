export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WPRefTest' })).result

  // Test: does references accept a work plane ID, or only work coordinate system IDs?
  const wpId = (await api.v1.part.workPlane({
    id: partId,
    name: 'OffsetPlane',
    origin: [0, 0, 50],
    normal: [0, 0, 1],
    xDirection: [1, 0, 0],
  })).result
  console.log('[13] wpId:', wpId)

  // Try passing work plane as reference
  const r = await api.v1.part.box({ id: partId, name: 'OnPlane', references: [wpId], length: 40, width: 40, height: 30 })
  console.log('[13] box with WP ref - result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[13] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'wp-ref-response')

  await snapshot('workplane-ref')
  return { partId, wpId, boxId: r.result }
}
