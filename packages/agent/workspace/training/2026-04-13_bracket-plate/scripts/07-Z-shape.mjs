// Z-shape / staircase bracket — upper-left step + lower-right step (mirrored L)
// Profile: 8 lines, 2 R10 fillets at inner corners, 2 holes
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BracketPlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Z-shape profile (clockwise from top-left):
  // Top section (y=55→75): x=0 to x=60 (full width 60, height 20)
  // Middle section (y=25→55): x=20 to x=60 (connecting, height 30)
  // Bottom section (y=0→25): x=20 to x=40 (narrower, height 25)
  //
  // Inner corners: (20,55) and (40,25) → R10 fillets
  const verts = [
    [0, 75, 0],   // top-left
    [60, 75, 0],  // top-right
    [60, 25, 0],  // right step top
    [40, 25, 0],  // right step inner
    [40, 0, 0],   // bottom-right
    [20, 0, 0],   // bottom-left
    [20, 55, 0],  // left step inner
    [0, 55, 0],   // left step top
  ]
  const L = []
  for (let i = 0; i < verts.length; i++) {
    const r = await api.v1.sketch.line({
      id: skId, startPos: verts[i], endPos: verts[(i + 1) % verts.length],
    })
    L.push(r.result)
  }
  // L0=top, L1=rightUpper, L2=rightStep, L3=rightLower, L4=bottom, L5=leftLower, L6=leftStep, L7=leftUpper
  console.log('[07] lines:', L)

  // R10 fillet at left inner corner (20,55): L5 (left wall up) meets L6 (left step left)
  const f1 = await api.v1.sketch.fillet({ id: skId, lineIds: [L[5], L[6]], radius: 10 })
  console.log('[07] fillet1 @(20,55):', f1.result, 'maxLevel:', f1.maxLevel)

  // R10 fillet at right inner corner (40,25): L2 (right step left) meets L3 (right wall down)
  const f2 = await api.v1.sketch.fillet({ id: skId, lineIds: [L[2], L[3]], radius: 10 })
  console.log('[07] fillet2 @(40,25):', f2.result, 'maxLevel:', f2.maxLevel)

  // Upper hole: centered in top section at (30, 55), R5
  const h1 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 55, 0], radius: 5 })
  console.log('[07] upper hole:', h1.result)

  // Lower hole: centered in bottom section at (30, 10), R5
  const h2 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 10, 0], radius: 5 })
  console.log('[07] lower hole:', h2.result)

  await snapshot('Z-bracket')
  return { partId, skId }
}
