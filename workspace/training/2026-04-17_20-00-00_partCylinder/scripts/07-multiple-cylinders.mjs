export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiCyl' })).result

  // Create several cylinders at different positions using WCS
  const wcs1 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const wcs2 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS2',
    origin: [100, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const wcs3 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS3',
    origin: [0, 100, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const c1 = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', references: [wcs1], diameter: 60, height: 100 })).result
  const c2 = (await api.v1.part.cylinder({ id: partId, name: 'Cyl2', references: [wcs2], diameter: 40, height: 150 })).result
  const c3 = (await api.v1.part.cylinder({ id: partId, name: 'Cyl3', references: [wcs3], diameter: 80, height: 50 })).result

  console.log('[07] cyl IDs:', c1, c2, c3)

  await snapshot('multiple')
  return { partId, c1, c2, c3 }
}
