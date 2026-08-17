// 15 — Study result ordering: are segments grouped by original curve?
// Create curves in known order and check if result groups by parent curve
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitOrder' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Circle at origin
  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  // Horizontal line
  const hLine = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result
  // Vertical line
  const vLine = (await api.v1.sketch.line({ id: skId, startPos: [0, -60, 0], endPos: [0, 60, 0] })).result
  console.log('[15] circle:', circle, 'hLine:', hLine, 'vLine:', vLine)

  const r = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[15] result:', JSON.stringify(r.result))

  // Map each result ID to its parent curve name
  const tree = r.structure?.tree
  if (tree) {
    const segments = r.result.map(id => {
      const node = tree[String(id)]
      return { id, name: node?.name, class: node?.class }
    })
    console.log('[15] segment ordering:')
    for (const s of segments) {
      console.log('[15]  ', s.id, s.name, `(${s.class})`)
    }
    filewrite(segments, 'ordering')
  }

  return { partId }
}
