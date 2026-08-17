// Error case: wrong ID type (part ID instead of EIF ID)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereWrongId' })).result

  const r = await api.v1.solid.sphere({ id: partId, radius: 30 })
  console.log('[07b] wrong id type — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[07b] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'wrong-id-type')

  return { partId }
}
