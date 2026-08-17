export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiCones' })).result

  const wcs1 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const wcs2 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS2',
    origin: [80, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const wcs3 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS3',
    origin: [0, 80, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Standard cone
  const c1 = await api.v1.part.cone({ id: partId, name: 'Standard', references: [wcs1], bDiameter: 50, tDiameter: 5, height: 70 })
  // Fat cone
  const c2 = await api.v1.part.cone({ id: partId, name: 'FatCone', references: [wcs2], bDiameter: 60, tDiameter: 40, height: 40 })
  // Inverted cone
  const c3 = await api.v1.part.cone({ id: partId, name: 'InvCone', references: [wcs3], bDiameter: 20, tDiameter: 50, height: 70 })

  console.log('[15] c1:', c1.result, 'c2:', c2.result, 'c3:', c3.result)
  filewrite({
    c1: { result: c1.result, maxLevel: c1.maxLevel },
    c2: { result: c2.result, maxLevel: c2.maxLevel },
    c3: { result: c3.result, maxLevel: c3.maxLevel },
  }, 'multi-cones-response')

  await snapshot('multi-cones')
  return { partId }
}
