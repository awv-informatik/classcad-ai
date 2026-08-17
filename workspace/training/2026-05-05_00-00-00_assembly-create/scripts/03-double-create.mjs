export default async function (api, { filewrite }) {
  // Test: what happens if you call assembly.create twice?
  const r1 = await api.v1.assembly.create({ name: 'First' })
  console.log('[03] first create:', r1.result, 'maxLevel:', r1.maxLevel)

  const r2 = await api.v1.assembly.create({ name: 'Second' })
  console.log('[03] second create:', r2.result, 'maxLevel:', r2.maxLevel)

  // Does the first assembly still exist? Check structure
  filewrite(r2.structure, 'structure-after-double-create')

  return { first: r1.result, second: r2.result }
}
