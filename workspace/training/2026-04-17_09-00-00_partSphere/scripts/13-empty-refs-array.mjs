export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereTest' })).result

  // Create with explicit empty references array
  const r = await api.v1.part.sphere({ id: partId, name: 'EmptyRefs', radius: 40, references: [] })
  console.log('[13] empty refs result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'empty-refs-response')

  await snapshot('empty-refs')
  return { partId }
}
