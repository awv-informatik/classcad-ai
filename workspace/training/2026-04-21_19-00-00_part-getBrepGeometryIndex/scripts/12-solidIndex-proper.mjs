export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a box and a cylinder as separate solids
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  // Create workCSys offset for the cylinder
  const wcsId = (await api.v1.part.workCSys({ id: partId, origin: [150, 0, 0] })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, references: [wcsId], radius: 20, height: 30 })).result
  await api.v1.common.recalc({})

  // Get edges from both solids
  const geo = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [0, 0, 20] },    // box front-left vertical
    ],
    circles: [
      { pos: [150, 0, 0] },   // cylinder bottom circle (center)
    ],
  })
  console.log('[12] box edge:', geo.result.lines[0])
  console.log('[12] cyl circle:', geo.result.circles[0])

  const boxEdge = geo.result.lines[0]
  const cylCircle = geo.result.circles?.[0]

  // Index box edge against box feature
  const r1 = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: boxEdge })
  console.log('[12] boxEdge → boxFeature:', r1.result, 'maxLevel:', r1.maxLevel)

  // Index box edge against cyl feature → expect -1
  const r2 = await api.v1.part.getBrepGeometryIndex({ id: cylId, geomId: boxEdge })
  console.log('[12] boxEdge → cylFeature:', r2.result, 'maxLevel:', r2.maxLevel)

  if (cylCircle && !Array.isArray(cylCircle)) {
    // Index cyl circle against cyl feature
    const r3 = await api.v1.part.getBrepGeometryIndex({ id: cylId, geomId: cylCircle })
    console.log('[12] cylCircle → cylFeature:', r3.result, 'maxLevel:', r3.maxLevel)

    // Index cyl circle against box feature → expect -1
    const r4 = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: cylCircle })
    console.log('[12] cylCircle → boxFeature:', r4.result, 'maxLevel:', r4.maxLevel)

    // Now do union with keepTools
    const boolId = (await api.v1.part.boolean({
      id: partId,
      type: 'UNION',
      target: boxId,
      tools: [cylId],
      keepTools: true,
    })).result
    await api.v1.common.recalc({})
    console.log('[12] boolId:', boolId)

    // Re-query edges after union
    const geoPost = await api.v1.part.getGeometryIds({
      id: partId,
      lines: [{ pos: [0, 0, 20] }],
      circles: [{ pos: [150, 0, 0] }],
    })
    const newBoxEdge = geoPost.result.lines[0]
    const newCylCircle = geoPost.result.circles?.[0]
    console.log('[12] post-union box edge:', newBoxEdge)
    console.log('[12] post-union cyl circle:', newCylCircle)

    // Test solidIndex against the boolean feature
    if (newBoxEdge && !Array.isArray(newBoxEdge)) {
      const r5 = await api.v1.part.getBrepGeometryIndex({ id: boolId, geomId: newBoxEdge, solidIndex: 0 })
      console.log('[12] newBoxEdge → bool solidIndex=0:', r5.result, 'maxLevel:', r5.maxLevel)
      const r6 = await api.v1.part.getBrepGeometryIndex({ id: boolId, geomId: newBoxEdge, solidIndex: 1 })
      console.log('[12] newBoxEdge → bool solidIndex=1:', r6.result, 'maxLevel:', r6.maxLevel)
    }
    if (newCylCircle && !Array.isArray(newCylCircle)) {
      const r7 = await api.v1.part.getBrepGeometryIndex({ id: boolId, geomId: newCylCircle, solidIndex: 0 })
      console.log('[12] newCylCircle → bool solidIndex=0:', r7.result, 'maxLevel:', r7.maxLevel)
      const r8 = await api.v1.part.getBrepGeometryIndex({ id: boolId, geomId: newCylCircle, solidIndex: 1 })
      console.log('[12] newCylCircle → bool solidIndex=1:', r8.result, 'maxLevel:', r8.maxLevel)
    }
  }

  await snapshot('union-keeptools')
  return { partId }
}
