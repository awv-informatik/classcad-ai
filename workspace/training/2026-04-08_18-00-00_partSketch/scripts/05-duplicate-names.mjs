// 05 — Duplicate sketch names via part.sketch
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const sk1 = await api.v1.part.sketch({ id: partId, name: 'Profile' })
  console.log('[05] first sketch id:', sk1.result, 'maxLevel:', sk1.maxLevel)

  const sk2 = await api.v1.part.sketch({ id: partId, name: 'Profile' })
  console.log('[05] second sketch id:', sk2.result, 'maxLevel:', sk2.maxLevel)
  console.log('[05] same id?', sk1.result === sk2.result)

  // getSketch should return the first one
  const found = await api.v1.part.getSketch({ id: partId, name: 'Profile' })
  console.log('[05] getSketch returns:', found.result, '(first was', sk1.result, ')')

  filewrite(found.structure, 'structure-duplicate-names')

  return { partId, sk1: sk1.result, sk2: sk2.result, foundId: found.result }
}
