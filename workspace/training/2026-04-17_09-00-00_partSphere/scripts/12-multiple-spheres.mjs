export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereTest' })).result

  const wcs1 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [80, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const wcs2 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS2',
    origin: [0, 80, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const s1 = (await api.v1.part.sphere({ id: partId, name: 'A', radius: 30 })).result
  const s2 = (await api.v1.part.sphere({ id: partId, name: 'B', radius: 20, references: [wcs1] })).result
  const s3 = (await api.v1.part.sphere({ id: partId, name: 'C', radius: 25, references: [wcs2] })).result

  console.log('[12] s1:', s1, 's2:', s2, 's3:', s3)
  filewrite({ s1, s2, s3 }, 'multi-ids')

  await snapshot('multiple')
  return { partId }
}
