// Constrained cutout: 4 rough lines + 2 rough ear arcs → chain + H/V + TANGENT(ear, edge)
// + R4 x2 + HD90 + VD40 + FIX bottom-right corner (105,20).
// The ear-tangent-inside-edge condition is expressed as TANGENT at the shared corner point.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MixerConstrained' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'CutoutProfile' })).result

  const arc = (cx, cy, r, aDeg, bDeg, cw = false) => ({
    startPos: [cx + r * Math.cos(aDeg * Math.PI / 180), cy + r * Math.sin(aDeg * Math.PI / 180), 0],
    endPos: [cx + r * Math.cos(bDeg * Math.PI / 180), cy + r * Math.sin(bDeg * Math.PI / 180), 0],
    centerPos: [cx, cy, 0], isClockwise: cw,
  })

  // rough seeds; datum corner (105,20) exact on the bottom line end
  const bottom = (await api.v1.sketch.line({ id: skId, startPos: [18, 22, 0], endPos: [105, 20, 0] })).result
  const right = (await api.v1.sketch.line({ id: skId, startPos: [104, 21, 0], endPos: [106, 58, 0] })).result
  const top = (await api.v1.sketch.line({ id: skId, startPos: [103, 61, 0], endPos: [17, 59, 0] })).result
  const earT = (await api.v1.sketch.arcByCenter({ id: skId, ...arc(16, 55, 5, 90, 270) })).result // CCW via 180
  const leftL = (await api.v1.sketch.line({ id: skId, startPos: [14, 51, 0], endPos: [16, 29, 0] })).result
  const earB = (await api.v1.sketch.arcByCenter({ id: skId, ...arc(14, 25, 3, 90, 270) })).result // CCW via 180
  const P = {}
  for (const [k, id] of Object.entries({ bottom, right, top, earT, leftL, earB }))
    P[k] = (await api.v1.sketch.getPoints({ id })).result

  const fx = await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [P.bottom.endId] })
  const rel = await api.v1.sketch.constraint([
    { id: skId, type: 'COINCIDENT', geomIds: [P.bottom.endId, P.right.startId] },
    { id: skId, type: 'COINCIDENT', geomIds: [P.right.endId, P.top.startId] },
    { id: skId, type: 'COINCIDENT', geomIds: [P.top.endId, P.earT.startId] },
    { id: skId, type: 'COINCIDENT', geomIds: [P.earT.endId, P.leftL.startId] },
    { id: skId, type: 'COINCIDENT', geomIds: [P.leftL.endId, P.earB.startId] },
    { id: skId, type: 'COINCIDENT', geomIds: [P.earB.endId, P.bottom.startId] },
    { id: skId, type: 'HORIZONTAL', geomIds: [bottom] },
    { id: skId, type: 'HORIZONTAL', geomIds: [top] },
    { id: skId, type: 'VERTICAL', geomIds: [right] },
    { id: skId, type: 'VERTICAL', geomIds: [leftL] },
    { id: skId, type: 'TANGENT', geomIds: [earT, top] },
    { id: skId, type: 'TANGENT', geomIds: [earB, bottom] },
    // drawing fact "ears bulge outward only" == ear centers lie ON the left edge line
    { id: skId, type: 'COINCIDENT', geomIds: [P.earT.centerId, leftL] },
    { id: skId, type: 'COINCIDENT', geomIds: [P.earB.centerId, leftL] },
  ])
  const dims = await api.v1.sketch.dimension([
    { id: skId, name: 'R4_t', type: 'RADIUS', geomIds: [earT], value: 4 },
    { id: skId, name: 'R4_b', type: 'RADIUS', geomIds: [earB], value: 4 },
    { id: skId, name: 'w90', type: 'HORIZONTAL_DISTANCE', geomIds: [bottom], value: 90 },
    { id: skId, name: 'h40', type: 'VERTICAL_DISTANCE', geomIds: [right], value: 40 },
  ])
  console.log('[04] fixation:', fx.maxLevel, 'relations:', rel.maxLevel, 'dims:', dims.maxLevel)

  const targets = {
    'bottom.start (15,20)': [P.bottom.startId, 15, 20],
    'bottom.end (105,20)': [P.bottom.endId, 105, 20],
    'right.end (105,60)': [P.right.endId, 105, 60],
    'top.end (15,60)': [P.top.endId, 15, 60],
    'earT.center (15,56)': [P.earT.centerId, 15, 56],
    'earT.end (15,52)': [P.earT.endId, 15, 52],
    'leftL.end (15,28)': [P.leftL.endId, 15, 28],
    'earB.center (15,24)': [P.earB.centerId, 15, 24],
  }
  let pass = 0, total = 0
  for (const [label, [pid, tx, ty]] of Object.entries(targets)) {
    const p = (await api.v1.sketch.getPositions({ id: pid })).result.pos
    const ok = Math.abs(p.x - tx) < 1e-6 && Math.abs(p.y - ty) < 1e-6
    total++; if (ok) pass++
    console.log(`[04] ${ok ? '✓' : '❌'} ${label} → (${p.x.toFixed(9)}, ${p.y.toFixed(9)})`)
  }
  console.log('[04] solved-coordinate checks:', pass, '/', total)

  filewrite({ pass, total }, 'cutout-verify')
  await snapshot('04-cutout-sketch')
  return { pass, total }
}
