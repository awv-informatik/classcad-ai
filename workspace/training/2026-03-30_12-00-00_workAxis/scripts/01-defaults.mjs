// Test: workAxis with just part ID (all defaults)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create work axis with only required param
  const r = await api.v1.part.workAxis({ id: partId })
  console.log('[01] workAxis result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  // Check structure for the work axis feature
  const wa = r.structure
  filewrite(wa, 'structure')

  await snapshot('default-workaxis')

  return { partId, workAxisId: r.result }
}
