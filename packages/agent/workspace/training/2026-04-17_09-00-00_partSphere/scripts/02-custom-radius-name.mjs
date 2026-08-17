export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereTest' })).result

  const r = await api.v1.part.sphere({ id: partId, name: 'MySphere', radius: 50 })
  console.log('[02] sphere result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'custom-response')

  await snapshot('custom')
  return { partId, sphereId: r.result }
}
