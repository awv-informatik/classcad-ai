// Snapshot after part.create — what does an empty part look like?
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'SnapshotTest' })).result
  console.log('[07] partId:', partId)
  await snapshot('empty-part')
  return { partId }
}
