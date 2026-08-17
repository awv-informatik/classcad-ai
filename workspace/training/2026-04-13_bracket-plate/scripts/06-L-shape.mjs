// L-bracket shape — lower-left cut away (NOT a U-notch)
// Profile: 6 lines, 1 R10 fillet at inner corner, 2 holes
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BracketPlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // L-shape profile (clockwise from top-left):
  // (0,75) → (60,75) → (60,0) → (20,0) → (20,25) → (0,25) → (0,75)
  //
  // Dims: top=60, right=75, left=50 (from y=25 to y=75)
  // Step at y=25, step wall at x=20
  // Inner corner at (20,25) gets R10
  const verts = [
    [0, 75, 0], [60, 75, 0], [60, 0, 0],
    [20, 0, 0], [20, 25, 0], [0, 25, 0],
  ]
  const L = []
  for (let i = 0; i < verts.length; i++) {
    const r = await api.v1.sketch.line({
      id: skId, startPos: verts[i], endPos: verts[(i + 1) % verts.length],
    })
    L.push(r.result)
    console.log(`[06] L${i}: ${r.result} maxLevel:${r.maxLevel}`)
  }
  // L0=top, L1=right, L2=bottom, L3=stepWall, L4=stepTop, L5=left

  // R10 fillet at inner corner (20,25): L3 (step wall) meets L4 (step top)
  const f = await api.v1.sketch.fillet({ id: skId, lineIds: [L[3], L[4]], radius: 10 })
  console.log('[06] fillet:', f.result, 'maxLevel:', f.maxLevel)

  // Two holes
  const h1 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 55, 0], radius: 5 })
  const h2 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 10, 0], radius: 5 })
  console.log('[06] holes:', h1.result, h2.result)

  await snapshot('L-bracket')
  return { partId, skId }
}
