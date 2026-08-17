// 01 — Basic part.sketch call with just partId (default plane, default name)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  console.log('[01] partId:', partId)

  const r = await api.v1.part.sketch({ id: partId })
  console.log('[01] part.sketch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  // Dump structure to see what objects were created
  filewrite(r.structure, 'structure-after-sketch')

  await snapshot('basic-sketch')
  return { partId, sketchId: r.result }
}
