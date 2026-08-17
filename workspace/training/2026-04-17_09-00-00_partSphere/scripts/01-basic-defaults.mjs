export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereTest' })).result
  console.log('[01] partId:', partId)

  const r = await api.v1.part.sphere({ id: partId })
  console.log('[01] sphere result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'default-response')

  await snapshot('default')
  return { partId, sphereId: r.result }
}
