// 06 — What happens when normal is parallel to xAxis?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConflictTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Case 1: normal == xAxis (both [1,0,0]) — docs say "should be different"
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Parallel' })).result
  const r1 = await api.v1.curve.arcByCenterRadAngle({
    id: s1, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 10,
    xAxis: [1, 0, 0], normal: [1, 0, 0],
  })
  console.log('[06] parallel:', r1.result, 'maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))

  // Case 2: normal = [0,0,1], xAxis = [0,0,1] (also parallel, both Z)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'ParallelZ' })).result
  const r2 = await api.v1.curve.arcByCenterRadAngle({
    id: s2, centerPos: [30, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 10,
    xAxis: [0, 0, 1], normal: [0, 0, 1],
  })
  console.log('[06] parallelZ:', r2.result, 'maxLevel:', r2.maxLevel, 'messages:', JSON.stringify(r2.messages))

  // Case 3: normal = -xAxis (anti-parallel)
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'AntiParallel' })).result
  const r3 = await api.v1.curve.arcByCenterRadAngle({
    id: s3, centerPos: [60, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 10,
    xAxis: [1, 0, 0], normal: [-1, 0, 0],
  })
  console.log('[06] antiParallel:', r3.result, 'maxLevel:', r3.maxLevel, 'messages:', JSON.stringify(r3.messages))

  filewrite({
    parallel: { maxLevel: r1.maxLevel, msgs: r1.messages },
    parallelZ: { maxLevel: r2.maxLevel, msgs: r2.messages },
    antiParallel: { maxLevel: r3.maxLevel, msgs: r3.messages },
  }, 'responses')

  await snapshot('conflict')
  return { partId }
}
