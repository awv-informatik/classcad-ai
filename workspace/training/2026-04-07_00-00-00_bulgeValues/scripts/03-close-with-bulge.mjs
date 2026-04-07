// Test bulge on closing segment with close: true
// The last bulge should control the arc from last point back to first
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CloseBulge' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const b90 = Math.tan(Math.PI / 8)

  // Shape 1: closed polyline with bulge on closing segment (last point)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'ClosedWithBulge' })).result
  const r1 = await api.v1.curve.polyline2d({
    id: s1,
    points: [
      [0, 0, 0],
      [40, 0, 0],
      [40, 40, 0],
      [0, 40, 0],
    ],
    bulges: [0, 0, 0, b90], // bulge on last point → closing arc
    close: true,
  })
  console.log('[03] closed with last bulge:', r1.maxLevel)

  // Shape 2: same but open — last bulge should be ignored
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'OpenWithBulge' })).result
  const r2 = await api.v1.curve.polyline2d({
    id: s2,
    points: [
      [0, -60, 0],
      [40, -60, 0],
      [40, -20, 0],
      [0, -20, 0],
    ],
    bulges: [0, 0, 0, b90], // bulge on last point — should be ignored (open)
    close: false,
  })
  console.log('[03] open with last bulge:', r2.maxLevel)

  filewrite(r1.graphic, 'closed-graphic')
  filewrite(r2.graphic, 'open-graphic')

  await snapshot('close-with-bulge')
  return { partId }
}
