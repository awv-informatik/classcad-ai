export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiBoxTest' })).result

  // Create 3 boxes with different sizes at different positions (via WCS)
  const wcs1 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const wcs2 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS2', origin: [80, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const wcs3 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS3', origin: [0, 80, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const b1 = (await api.v1.part.box({ id: partId, name: 'Box1', references: [wcs1], length: 60, width: 60, height: 30 })).result
  const b2 = (await api.v1.part.box({ id: partId, name: 'Box2', references: [wcs2], length: 40, width: 40, height: 60 })).result
  const b3 = (await api.v1.part.box({ id: partId, name: 'Box3', references: [wcs3], length: 50, width: 30, height: 50 })).result

  console.log('[12] box IDs:', b1, b2, b3)

  // Dump structure to see feature tree
  const structR = await api.v1.common.recalc({})
  filewrite(structR.structure, 'multi-box-structure')

  await snapshot('three-boxes')
  return { partId, b1, b2, b3 }
}
