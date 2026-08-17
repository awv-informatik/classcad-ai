// 02 — part.sketch with custom name
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const r = await api.v1.part.sketch({ id: partId, name: 'FrontProfile' })
  console.log('[02] part.sketch result:', r.result, 'maxLevel:', r.maxLevel)

  // Check the name in structure
  const nodes = r.structure?.tree || r.structure
  filewrite(r.structure, 'structure-named')

  await snapshot('named-sketch')
  return { partId, sketchId: r.result }
}
