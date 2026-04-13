// Draw the bracket plate profile: 8 lines + R10 fillets + 2 holes
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BracketPlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  console.log('[01] partId:', partId, 'skId:', skId)

  // 8 lines forming the outer profile (clockwise from top-left)
  // Profile: 60 wide × 75 tall, U-notch on left (x=0→20, y=25→55)
  const lines = await api.v1.sketch.line({
    id: skId,
    startPos: [
      [0, 75, 0],   // L0: top edge
      [60, 75, 0],  // L1: right edge
      [60, 0, 0],   // L2: bottom edge
      [0, 0, 0],    // L3: left bottom section
      [0, 25, 0],   // L4: notch bottom
      [20, 25, 0],  // L5: notch wall
      [20, 55, 0],  // L6: notch top
      [0, 55, 0],   // L7: left top section
    ],
    endPos: [
      [60, 75, 0],
      [60, 0, 0],
      [0, 0, 0],
      [0, 25, 0],
      [20, 25, 0],
      [20, 55, 0],
      [0, 55, 0],
      [0, 75, 0],
    ],
  })
  const lineIds = lines.result
  console.log('[01] lines:', lineIds.length, 'ids, maxLevel:', lines.maxLevel)

  // R10 fillets at notch inner corners
  // Corner (20,25): L4 (notch bottom) meets L5 (notch wall)
  const f1 = await api.v1.sketch.fillet({
    id: skId,
    lineIds: [lineIds[4], lineIds[5]],
    radius: 10,
  })
  console.log('[01] fillet1 @(20,25):', f1.result, 'maxLevel:', f1.maxLevel)

  // Corner (20,55): L5 (notch wall) meets L6 (notch top)
  const f2 = await api.v1.sketch.fillet({
    id: skId,
    lineIds: [lineIds[5], lineIds[6]],
    radius: 10,
  })
  console.log('[01] fillet2 @(20,55):', f2.result, 'maxLevel:', f2.maxLevel)

  // Two holes
  const c1 = await api.v1.sketch.circle({
    id: skId,
    centerPos: [30, 55, 0],
    radius: 5,
  })
  console.log('[01] upper hole:', c1.result, 'maxLevel:', c1.maxLevel)

  const c2 = await api.v1.sketch.circle({
    id: skId,
    centerPos: [30, 10, 0],
    radius: 5,
  })
  console.log('[01] lower hole:', c2.result, 'maxLevel:', c2.maxLevel)

  await snapshot('bracket')

  filewrite({
    lineIds,
    fillet1: f1.result,
    fillet2: f2.result,
    upperHole: c1.result,
    lowerHole: c2.result,
  }, 'ids')

  return { partId, skId }
}
