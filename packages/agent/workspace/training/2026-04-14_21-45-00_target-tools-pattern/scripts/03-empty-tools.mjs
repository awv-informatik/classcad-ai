// Test: Does tools: [] (empty array) behave as no-op across all 4 operations?
// Expected: return target ID, maxLevel=31, no change to geometry
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptyToolsTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const results = {}

  for (const op of ['union', 'subtraction', 'intersection', 'merge']) {
    const target = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
    const r = await api.v1.solid[op]({ id: eifId, target, tools: [] })
    results[op] = {
      result: r.result,
      targetReturned: r.result === target,
      maxLevel: r.maxLevel,
      messages: r.messages
    }
    console.log(`[03] ${op} tools=[]: result=${r.result === target ? 'target' : r.result}, maxLevel=${r.maxLevel}`)
  }

  filewrite(results, 'empty-tools-results')
  return { partId }
}
