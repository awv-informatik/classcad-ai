// Test bulge = tan(a/4) for known angles: 45°, 90°, 120°, 180°, 270°, 360°
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BulgeAngles' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const angles = [45, 90, 120, 180, 270, 359.9]
  const results = []

  for (const deg of angles) {
    const rad = (deg * Math.PI) / 180
    const bulge = Math.tan(rad / 4)
    const shapeId = (await api.v1.curve.shape({ id: eifId, name: `arc${deg}` })).result

    // Two-point polyline with bulge — segment from (0,0) to (40,0)
    // Offset each shape vertically so they don't overlap
    const yOff = angles.indexOf(deg) * 50
    const r = await api.v1.curve.polyline2d({
      id: shapeId,
      points: [
        [0, yOff, 0],
        [40, yOff, 0],
      ],
      bulges: [bulge, 0],
    })

    const entry = { deg, rad, bulge, maxLevel: r.maxLevel, result: r.result }
    console.log(`[01] ${deg}° → bulge=${bulge.toFixed(6)}, maxLevel=${r.maxLevel}`)
    results.push(entry)
  }

  filewrite(results, 'known-angles')
  await snapshot('known-angles')
  return { partId }
}
