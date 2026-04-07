// 10 — Missing required parameters: error messages
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MissingParams' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  const results = {}

  // Missing centerPos
  try {
    const r1 = await api.v1.curve.arcByCenterRadAngle({
      id: shapeId, startAngle: 0, endAngle: Math.PI, radius: 10,
    })
    results.noCenterPos = { maxLevel: r1.maxLevel, msgs: r1.messages }
    console.log('[10] no centerPos:', r1.maxLevel, JSON.stringify(r1.messages))
  } catch (e) { results.noCenterPos = { error: e.message }; console.log('[10] no centerPos error:', e.message) }

  // Missing startAngle
  try {
    const r2 = await api.v1.curve.arcByCenterRadAngle({
      id: shapeId, centerPos: [0, 0, 0], endAngle: Math.PI, radius: 10,
    })
    results.noStartAngle = { maxLevel: r2.maxLevel, msgs: r2.messages }
    console.log('[10] no startAngle:', r2.maxLevel, JSON.stringify(r2.messages))
  } catch (e) { results.noStartAngle = { error: e.message }; console.log('[10] no startAngle error:', e.message) }

  // Missing endAngle
  try {
    const r3 = await api.v1.curve.arcByCenterRadAngle({
      id: shapeId, centerPos: [0, 0, 0], startAngle: 0, radius: 10,
    })
    results.noEndAngle = { maxLevel: r3.maxLevel, msgs: r3.messages }
    console.log('[10] no endAngle:', r3.maxLevel, JSON.stringify(r3.messages))
  } catch (e) { results.noEndAngle = { error: e.message }; console.log('[10] no endAngle error:', e.message) }

  // Missing radius
  try {
    const r4 = await api.v1.curve.arcByCenterRadAngle({
      id: shapeId, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI,
    })
    results.noRadius = { maxLevel: r4.maxLevel, msgs: r4.messages }
    console.log('[10] no radius:', r4.maxLevel, JSON.stringify(r4.messages))
  } catch (e) { results.noRadius = { error: e.message }; console.log('[10] no radius error:', e.message) }

  // Missing id
  try {
    const r5 = await api.v1.curve.arcByCenterRadAngle({
      centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI, radius: 10,
    })
    results.noId = { maxLevel: r5.maxLevel, msgs: r5.messages }
    console.log('[10] no id:', r5.maxLevel, JSON.stringify(r5.messages))
  } catch (e) { results.noId = { error: e.message }; console.log('[10] no id error:', e.message) }

  filewrite(results, 'missing-params')
  return { partId }
}
