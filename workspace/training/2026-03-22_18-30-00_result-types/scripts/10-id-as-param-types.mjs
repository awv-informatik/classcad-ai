// Test: docs say params accept string|real|id — can we pass IDs as strings?
export default async function ({ execute }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'ParamTest' }] })).result
  console.log(`[param] partId=${partId} type=${typeof partId}`)

  // Pass ID as number (normal)
  const r1 = await execute({ 'v1.sketch.create': [{ id: partId }] })
  console.log(`[param] asNumber(${partId}): result=${r1.result} maxLevel=${r1.maxLevel} ok=${r1.maxLevel<51}`)

  // Pass ID as string of the number
  const r2 = await execute({ 'v1.sketch.create': [{ id: String(partId) }] })
  console.log(`[param] asString("${partId}"): result=${r2.result} maxLevel=${r2.maxLevel} ok=${r2.maxLevel<51}`)

  // Pass ID as float
  const r3 = await execute({ 'v1.sketch.create': [{ id: partId + 0.5 }] })
  console.log(`[param] asFloat(${partId+0.5}): result=${r3.result} maxLevel=${r3.maxLevel} ok=${r3.maxLevel<51}`)

  // Pass ID as negative
  const r4 = await execute({ 'v1.sketch.create': [{ id: -partId }] })
  console.log(`[param] asNeg(${-partId}): result=${r4.result} maxLevel=${r4.maxLevel} ok=${r4.maxLevel<51}`)

  // Pass ID as zero
  const r5 = await execute({ 'v1.sketch.create': [{ id: 0 }] })
  console.log(`[param] asZero(0): result=${r5.result} maxLevel=${r5.maxLevel} ok=${r5.maxLevel<51}`)

  return {}
}
