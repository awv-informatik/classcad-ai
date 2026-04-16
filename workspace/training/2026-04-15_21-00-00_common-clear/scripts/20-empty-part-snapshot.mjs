// 20 — control test: snapshot on a brand new part with no geometry
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'EmptyPart' })).result
  console.log('[20] partId:', partId)

  // Snapshot on empty part — no eif, no geometry
  await snapshot('empty-part')
  console.log('[20] snapshot on empty part succeeded')

  return { partId }
}
