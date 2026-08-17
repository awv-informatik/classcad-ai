// Examine exact position format — named object or array? What keys?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Point
  const ptId = (await api.v1.sketch.point({ id: skId, pos: [15.5, 22.3, 0] })).result
  const ptR = (await api.v1.sketch.getPositions({ id: ptId })).result
  console.log('[10] point result type:', typeof ptR, 'keys:', Object.keys(ptR))
  console.log('[10] point pos type:', typeof ptR.pos, 'keys:', ptR.pos ? Object.keys(ptR.pos) : 'N/A')
  console.log('[10] point pos:', JSON.stringify(ptR.pos))

  // Line
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [100, 50, 0] })).result
  const lineR = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[10] line result keys:', Object.keys(lineR))
  console.log('[10] line startPos type:', typeof lineR.startPos, 'keys:', lineR.startPos ? Object.keys(lineR.startPos) : 'N/A')
  console.log('[10] line startPos:', JSON.stringify(lineR.startPos))
  console.log('[10] line endPos:', JSON.stringify(lineR.endPos))

  // Arc
  const arcId = (await api.v1.sketch.arcByCenter({
    id: skId, startPos: [0, 40, 0], endPos: [40, 40, 0], centerPos: [20, 40, 0],
  })).result
  const arcR = (await api.v1.sketch.getPositions({ id: arcId })).result
  console.log('[10] arc result keys:', Object.keys(arcR))
  console.log('[10] arc centerPos:', JSON.stringify(arcR.centerPos))

  // Circle
  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [50, 50, 0], radius: 15 })).result
  const circR = (await api.v1.sketch.getPositions({ id: circId })).result
  console.log('[10] circle result keys:', Object.keys(circR))
  console.log('[10] circle centerPos:', JSON.stringify(circR.centerPos))

  // Does circle return radius?
  console.log('[10] circle full result:', JSON.stringify(circR))

  filewrite({
    point: { keys: Object.keys(ptR), posKeys: ptR.pos ? Object.keys(ptR.pos) : null, value: ptR },
    line: { keys: Object.keys(lineR), value: lineR },
    arc: { keys: Object.keys(arcR), value: arcR },
    circle: { keys: Object.keys(circR), value: circR },
  }, 'format-analysis')

  return { partId }
}
