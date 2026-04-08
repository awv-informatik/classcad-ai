// 02 — isClockwise=FALSE vs default TRUE comparison
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ClockwiseTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Arc with default isClockwise=TRUE
  const r1 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-40, 0, 0],
    centerPos: [0, 0, 0],
    endPos: [40, 0, 0],
  })
  console.log('[02] clockwise(default):', r1.result, 'maxLevel:', r1.maxLevel)

  // Arc with isClockwise=FALSE — offset vertically to distinguish
  const r2 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-40, -80, 0],
    centerPos: [0, -80, 0],
    endPos: [40, -80, 0],
    isClockwise: false,
  })
  console.log('[02] counterclockwise:', r2.result, 'maxLevel:', r2.maxLevel)

  // Query positions of both to compare
  const pos1 = (await api.v1.sketch.getPositions({ id: r1.result })).result
  const pos2 = (await api.v1.sketch.getPositions({ id: r2.result })).result
  console.log('[02] CW positions:', JSON.stringify(pos1))
  console.log('[02] CCW positions:', JSON.stringify(pos2))

  filewrite({ cwArc: { id: r1.result, positions: pos1 }, ccwArc: { id: r2.result, positions: pos2 } }, 'cw-vs-ccw')

  await snapshot('cw-vs-ccw')
  return { partId }
}
