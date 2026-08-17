export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvalidTest' })).result

  // Test invalid type strings
  const invalids = ['INVALID', 'Box', 'cc_box', 'CC_BOX', 'CC_box', '', 'CC_Part', 'CC_OperationSequence']

  const results = {}
  for (const t of invalids) {
    const r = await api.v1.part.createUncommitedObject({ id: partId, type: t, name: 'Test' })
    results[t || '(empty)'] = {
      result: r.result,
      maxLevel: r.maxLevel,
      message: r.messages?.[0]?.message || null,
    }
    console.log(`[12] "${t}": result=${r.result} maxLevel=${r.maxLevel} msg=${r.messages?.[0]?.message || 'none'}`)

    // Commit if successful
    if (r.result) {
      await api.v1.part.openFeature({ id: r.result })
      await api.v1.part.closeFeature({ id: r.result })
    }
  }

  filewrite(results, 'invalid-types')
  return { partId }
}
