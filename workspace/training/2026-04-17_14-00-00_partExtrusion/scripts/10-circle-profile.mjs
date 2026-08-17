export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CircleTest' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  // Circle profile → cylinder-like extrusion
  const sk1 = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const circId = (await api.v1.sketch.circle({ id: sk1, centerPos: [30, 30, 0], radius: 20 })).result
  console.log('[10] circle id:', circId)

  const regionId = (await api.v1.sketch.sketchRegion({ id: sk1, geomIds: [circId] })).result
  console.log('[10] region id:', regionId)

  const e1 = await api.v1.part.extrusion({
    id: partId, name: 'CylExt', references: [regionId], limit2: 50
  })
  console.log('[10] circle extrusion:', e1.result, 'maxLevel:', e1.maxLevel)

  // Circle with taper → cone-like shape
  const sk2 = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const circId2 = (await api.v1.sketch.circle({ id: sk2, centerPos: [90, 30, 0], radius: 20 })).result
  const regionId2 = (await api.v1.sketch.sketchRegion({ id: sk2, geomIds: [circId2] })).result

  const e2 = await api.v1.part.extrusion({
    id: partId, name: 'ConeExt', references: [regionId2], limit2: 50, taperAngle: 0.3
  })
  console.log('[10] tapered circle:', e2.result, 'maxLevel:', e2.maxLevel)

  filewrite({
    cylinder: { result: e1.result, maxLevel: e1.maxLevel, messages: e1.messages },
    cone: { result: e2.result, maxLevel: e2.maxLevel, messages: e2.messages },
  }, 'circle-results')

  await snapshot('circle-extrusions')
  return { partId }
}
