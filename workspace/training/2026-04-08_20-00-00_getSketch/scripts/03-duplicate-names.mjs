// Test getSketch with duplicate sketch names — which one is returned?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create 3 sketches all named "Dup"
  const sk1 = (await api.v1.part.sketch({ id: partId, name: 'Dup' })).result
  const sk2 = (await api.v1.part.sketch({ id: partId, name: 'Dup' })).result
  const sk3 = (await api.v1.part.sketch({ id: partId, name: 'Dup' })).result
  console.log('[03] created sketch IDs:', sk1, sk2, sk3)

  const r = await api.v1.part.getSketch({ id: partId, name: 'Dup' })
  console.log('[03] getSketch result:', r.result)
  console.log('[03] matches sk1?', r.result === sk1)
  console.log('[03] matches sk2?', r.result === sk2)
  console.log('[03] matches sk3?', r.result === sk3)

  filewrite({ createdIds: [sk1, sk2, sk3], foundId: r.result, matchesSk1: r.result === sk1 }, 'duplicate-response')

  return { partId }
}
