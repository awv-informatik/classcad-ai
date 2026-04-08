// 10 — Arcs with different start/end distances from center (non-equal radii)
// What happens when |start-center| != |end-center|? The docs say center defines the arc.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RadiiTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Equal radii: |start-center| = |end-center| = 40
  const r1 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-40, 0, 0],
    centerPos: [0, 0, 0],
    endPos: [40, 0, 0],
  })
  console.log('[10] equal radii:', r1.result, 'maxLevel:', r1.maxLevel)

  // Unequal radii: |start-center| = 40, |end-center| = 20
  const r2 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-40, -60, 0],
    centerPos: [0, -60, 0],
    endPos: [20, -60, 0],
  })
  console.log('[10] unequal radii:', r2.result, 'maxLevel:', r2.maxLevel, 'msgs:', JSON.stringify(r2.messages))

  if (r2.result) {
    const pos = (await api.v1.sketch.getPositions({ id: r2.result })).result
    console.log('[10] unequal radii positions:', JSON.stringify(pos))
    filewrite(pos, 'unequal-radii-positions')
  }

  await snapshot('radii-test')
  return { partId }
}
