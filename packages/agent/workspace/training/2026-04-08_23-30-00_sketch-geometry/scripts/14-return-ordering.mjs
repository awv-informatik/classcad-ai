// Test: does result preserve input ordering?
// Create multiple items and verify IDs come back in input order
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeomTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.geometry({
    id: skId,
    points: [
      { pos: [0, 0, 0] },
      { pos: [100, 0, 0] },
      { pos: [50, 50, 0] },
    ],
    lines: [
      { startPos: [0, 0, 0], endPos: [100, 0, 0] },
      { startPos: [100, 0, 0], endPos: [50, 50, 0] },
    ],
    circles: [
      { centerPos: [10, 10, 0], radius: 5 },
      { centerPos: [90, 10, 0], radius: 8 },
    ],
  })

  console.log('[14] points:', JSON.stringify(r.result.points), '(expect 3 IDs, ascending)')
  console.log('[14] lines:', JSON.stringify(r.result.lines), '(expect 2 IDs, ascending)')
  console.log('[14] circles:', JSON.stringify(r.result.circles), '(expect 2 IDs, ascending)')

  // Verify IDs are in ascending order (which implies creation order matches input order)
  const pointsAsc = r.result.points.every((v, i, a) => i === 0 || v > a[i - 1])
  const linesAsc = r.result.lines.every((v, i, a) => i === 0 || v > a[i - 1])
  const circlesAsc = r.result.circles.every((v, i, a) => i === 0 || v > a[i - 1])
  console.log('[14] points ascending:', pointsAsc)
  console.log('[14] lines ascending:', linesAsc)
  console.log('[14] circles ascending:', circlesAsc)

  filewrite({ result: r.result, pointsAsc, linesAsc, circlesAsc }, 'return-ordering')

  return { partId }
}
