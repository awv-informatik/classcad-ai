// Q: What are the ID class types that matter for API calls? What does each error code tell us?
// Map the error code patterns: 1006 (invalid ID) vs 1007 (wrong ID type)
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId })).result
  const sketchId = (await api.v1.sketch.create({ id: partId })).result

  // Find work plane ID from structure
  const tree = (await api.v1.common.getAppVersion({})).structure?.tree || {}
  let wpId = null
  for (const [k, n] of Object.entries(tree)) {
    if (n.class === 'CC_WorkPlane' && n.name === 'Top') { wpId = n.id; break }
  }
  console.log('[15] partId:', partId, 'boxId:', boxId, 'sketchId:', sketchId, 'wpId:', wpId)

  // Try sketch.create with feature ID instead of part ID
  const r1 = await api.v1.sketch.create({ id: boxId })
  console.log('[15] sketch.create(featureId):', r1.maxLevel, JSON.stringify(r1.messages.map(m => ({ code: m.code, msg: m.message }))))

  // Try sketch.create with work plane as id param
  const r2 = await api.v1.sketch.create({ id: wpId })
  console.log('[15] sketch.create(wpId):', r2.maxLevel, JSON.stringify(r2.messages.map(m => ({ code: m.code, msg: m.message }))))

  // Try part.box with sketch ID
  const r3 = await api.v1.part.box({ id: sketchId })
  console.log('[15] part.box(sketchId):', r3.maxLevel, JSON.stringify(r3.messages.map(m => ({ code: m.code, msg: m.message }))))

  // Try evaluateExpression with an ID context
  const r4 = await api.v1.common.evaluateExpression({ id: partId, expression: '1+1' })
  console.log('[15] evaluateExpression(partId):', r4.result, 'maxLevel:', r4.maxLevel)

  const r5 = await api.v1.common.evaluateExpression({ id: boxId, expression: '1+1' })
  console.log('[15] evaluateExpression(boxId):', r5.result, 'maxLevel:', r5.maxLevel)
}
