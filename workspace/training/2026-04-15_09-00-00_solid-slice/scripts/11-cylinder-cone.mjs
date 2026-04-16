// Test slicing cylinder and cone
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceCylCone' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Cylinder: height 60, diameter 30
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 60, diameter: 30 })).result
  console.log('[11] cylId:', cylId)

  // Slice cylinder at z=0 (midpoint), normal [0,0,1]
  const r1 = await api.v1.solid.slice({
    id: eifId,
    target: cylId,
    originPos: [0, 0, 0],
    normal: [0, 0, 1],
    keepBoth: false,
  })
  console.log('[11] cyl slice result:', r1.result, 'maxLevel:', r1.maxLevel)
  const c1 = r1.graphic?.containers?.[0]
  if (c1) console.log('[11] cyl AFTER min:', JSON.stringify(c1.properties.min), 'max:', JSON.stringify(c1.properties.max))

  // Cone: height 50, bDiameter 30, tDiameter 10, translated to x=60
  const coneId = (await api.v1.solid.cone({ id: eifId, height: 50, bDiameter: 30, tDiameter: 10, translation: [60, 0, 0] })).result
  console.log('[11] coneId:', coneId)

  // Slice cone at z=0
  const r2 = await api.v1.solid.slice({
    id: eifId,
    target: coneId,
    originPos: [0, 0, 0],
    normal: [0, 0, 1],
    keepBoth: false,
  })
  console.log('[11] cone slice result:', r2.result, 'maxLevel:', r2.maxLevel)
  const c2 = r2.graphic?.containers?.find(c => c.owner === coneId)
  if (c2) console.log('[11] cone AFTER min:', JSON.stringify(c2.properties.min), 'max:', JSON.stringify(c2.properties.max))

  filewrite({
    cylinder: { result: r1.result, maxLevel: r1.maxLevel, bbox: c1 ? { min: c1.properties.min, max: c1.properties.max } : null },
    cone: { result: r2.result, maxLevel: r2.maxLevel, bbox: c2 ? { min: c2.properties.min, max: c2.properties.max } : null },
  }, 'cyl-cone-results')

  await snapshot('cyl-cone-sliced')

  return { partId }
}
