export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletTest' })).result

  // Create a box, then add fillet — check that mass props work after feature chain
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

  // Before fillet
  const rBefore = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[14] before fillet:', JSON.stringify(rBefore.result))

  // Add fillet on top edges
  const geoIds = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [30, 0, 30] }],
  })).result
  console.log('[14] geoIds:', JSON.stringify(geoIds))

  if (geoIds.lines && geoIds.lines.length > 0) {
    const filletId = (await api.v1.part.fillet({
      id: partId,
      name: 'Fillet1',
      references: geoIds.lines,
      radius: 5,
    })).result
    console.log('[14] filletId:', filletId)

    const rAfter = await api.v1.part.calculateMassProperties({ id: partId })
    console.log('[14] after fillet:', JSON.stringify(rAfter.result))

    filewrite({
      before: rBefore.result,
      after: rAfter.result,
      volumeDiff: rBefore.result.volume - rAfter.result.volume,
    }, 'fillet-comparison')

    console.log('[14] volume removed by fillet:', (rBefore.result.volume - rAfter.result.volume).toFixed(2))
  }

  await snapshot('fillet')
  return { partId }
}
