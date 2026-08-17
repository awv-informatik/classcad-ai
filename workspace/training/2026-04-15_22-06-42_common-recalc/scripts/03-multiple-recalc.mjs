// Test calling recalc multiple times consecutively — idempotent?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiRecalc' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })

  const results = []
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.common.recalc()
    results.push({ i, result: r.result, maxLevel: r.maxLevel, msgCount: (r.messages || []).length })
    console.log(`[03] recalc #${i}: result=${r.result} maxLevel=${r.maxLevel} msgs=${(r.messages || []).length}`)
  }
  filewrite(results, 'multi-recalc')
  return { results }
}
