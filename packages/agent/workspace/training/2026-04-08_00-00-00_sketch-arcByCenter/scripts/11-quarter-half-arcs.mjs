// 11 — Various arc angles: quarter circle, half circle, 270-degree arc, near-full circle
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AngleTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Quarter circle (90 degrees CW): start at top, end at right
  const r1 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [0, 40, 0],
    centerPos: [0, 0, 0],
    endPos: [40, 0, 0],
  })
  console.log('[11] quarter CW:', r1.result, 'maxLevel:', r1.maxLevel)

  // Half circle (180 degrees CW): start at left, end at right
  const r2 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-40, -60, 0],
    centerPos: [0, -60, 0],
    endPos: [40, -60, 0],
  })
  console.log('[11] half CW:', r2.result, 'maxLevel:', r2.maxLevel)

  // 270 degrees CW (or 90 degrees CCW): start at right, end at top, going the long way
  const r3 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [120, -30, 0],
    centerPos: [80, -30, 0],
    endPos: [80, 10, 0],
    isClockwise: true,  // going CW from right to top = 270 degrees
  })
  console.log('[11] 270 CW:', r3.result, 'maxLevel:', r3.maxLevel)

  // Same points but CCW = 90 degrees
  const r4 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [120, -100, 0],
    centerPos: [80, -100, 0],
    endPos: [80, -60, 0],
    isClockwise: false,
  })
  console.log('[11] 90 CCW:', r4.result, 'maxLevel:', r4.maxLevel)

  await snapshot('angle-tests')
  return { partId }
}
