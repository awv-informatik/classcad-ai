// Test: Can tools come from a different EIF than the target?
// The merge LLM doc says cross-EIF merge is supported. Test all 4 operations.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CrossEIF' })).result
  const eif1 = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const eif2 = (await api.v1.part.entityInjection({ id: partId, name: 'EIF2' })).result

  const results = {}

  for (const op of ['union', 'subtraction', 'intersection', 'merge']) {
    // Target in EIF1
    const target = (await api.v1.solid.box({ id: eif1, length: 80, width: 60, height: 40 })).result
    // Tool in EIF2
    const tool = (await api.v1.solid.box({ id: eif2, length: 40, width: 30, height: 60, translation: [50, 20, 0] })).result

    // Boolean op: id=eif1 (target's EIF), but tool is from eif2
    const r = await api.v1.solid[op]({ id: eif1, target, tools: [tool] })
    results[op] = {
      result: r.result,
      maxLevel: r.maxLevel,
      messages: r.messages
    }
    console.log(`[13] ${op} cross-EIF: result=${r.result}, maxLevel=${r.maxLevel}`)
    if (r.messages?.length) console.log(`[13]   messages:`, JSON.stringify(r.messages))

    // Clean up for next iteration
    await api.v1.solid.deleteSolid({ id: eif1 })
    await api.v1.solid.deleteSolid({ id: eif2 })
  }

  filewrite(results, 'cross-eif-results')
  return { partId }
}
