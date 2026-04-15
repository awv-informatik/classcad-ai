// Test: How do the 4 operations handle invalid tool IDs?
// Cases: null, undefined, wrong type (string), non-existent numeric ID
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvalidTools' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const results = {}

  for (const op of ['union', 'subtraction', 'intersection', 'merge']) {
    const target = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
    results[op] = {}

    // tools: [null]
    const r1 = await api.v1.solid[op]({ id: eifId, target, tools: [null] })
    results[op].null = { maxLevel: r1.maxLevel, code: r1.messages?.[0]?.code }
    console.log(`[11] ${op} tools=[null]: maxLevel=${r1.maxLevel}, code=${r1.messages?.[0]?.code}`)

    // tools: [99999] (non-existent ID)
    const r2 = await api.v1.solid[op]({ id: eifId, target, tools: [99999] })
    results[op].nonExistent = { maxLevel: r2.maxLevel, code: r2.messages?.[0]?.code }
    console.log(`[11] ${op} tools=[99999]: maxLevel=${r2.maxLevel}, code=${r2.messages?.[0]?.code}`)

    // tools: ["bad"] (wrong type)
    const r3 = await api.v1.solid[op]({ id: eifId, target, tools: ['bad'] })
    results[op].wrongType = { maxLevel: r3.maxLevel, code: r3.messages?.[0]?.code }
    console.log(`[11] ${op} tools=["bad"]: maxLevel=${r3.maxLevel}, code=${r3.messages?.[0]?.code}`)
  }

  filewrite(results, 'invalid-tool-results')
  return { partId }
}
