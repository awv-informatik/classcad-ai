// Constrained block profile: ROUGH seeds → datum + constraints + drawing dims → solver lays out.
// Scheme: FIX bottom-right corner (120,0) · H/V on lines · COINCIDENT chain ·
// TANGENT line-arc at both corners · R10 ×2 · HD 120 (width) · VD 80 (height).
// Verify: all 6 joins + 2 arc centers vs exact targets, then extrude 35 → mass props.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MixerConstrained' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'BlockProfile' })).result

  const arc = (cx, cy, r, aDeg, bDeg, cw = false) => ({
    startPos: [cx + r * Math.cos(aDeg * Math.PI / 180), cy + r * Math.sin(aDeg * Math.PI / 180), 0],
    endPos: [cx + r * Math.cos(bDeg * Math.PI / 180), cy + r * Math.sin(bDeg * Math.PI / 180), 0],
    centerPos: [cx, cy, 0], isClockwise: cw,
  })

  // rough seeds — only the datum corner (120,0) is exact
  const bottom = (await api.v1.sketch.line({ id: skId, startPos: [14, 2, 0], endPos: [120, 0, 0] })).result
  const right = (await api.v1.sketch.line({ id: skId, startPos: [119, 3, 0], endPos: [121, 77, 0] })).result
  const top = (await api.v1.sketch.line({ id: skId, startPos: [116, 81, 0], endPos: [12, 83, 0] })).result
  const left = (await api.v1.sketch.line({ id: skId, startPos: [-2, 67, 0], endPos: [1, 13, 0] })).result
  const tl = (await api.v1.sketch.arcByCenter({ id: skId, ...arc(13, 67, 8, 90, 180) })).result
  const bl = (await api.v1.sketch.arcByCenter({ id: skId, ...arc(12, 14, 12, 180, 270) })).result

  const P = {}
  for (const [k, id] of Object.entries({ bottom, right, top, left, tl, bl }))
    P[k] = (await api.v1.sketch.getPoints({ id })).result

  const fx = await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [P.bottom.endId] })
  const rel = await api.v1.sketch.constraint([
    { id: skId, type: 'COINCIDENT', geomIds: [P.bottom.endId, P.right.startId] },
    { id: skId, type: 'COINCIDENT', geomIds: [P.right.endId, P.top.startId] },
    { id: skId, type: 'COINCIDENT', geomIds: [P.top.endId, P.tl.startId] },
    { id: skId, type: 'COINCIDENT', geomIds: [P.tl.endId, P.left.startId] },
    { id: skId, type: 'COINCIDENT', geomIds: [P.left.endId, P.bl.startId] },
    { id: skId, type: 'COINCIDENT', geomIds: [P.bl.endId, P.bottom.startId] },
    { id: skId, type: 'HORIZONTAL', geomIds: [bottom] },
    { id: skId, type: 'HORIZONTAL', geomIds: [top] },
    { id: skId, type: 'VERTICAL', geomIds: [right] },
    { id: skId, type: 'VERTICAL', geomIds: [left] },
    { id: skId, type: 'TANGENT', geomIds: [tl, top] },
    { id: skId, type: 'TANGENT', geomIds: [tl, left] },
    { id: skId, type: 'TANGENT', geomIds: [bl, left] },
    { id: skId, type: 'TANGENT', geomIds: [bl, bottom] },
  ])
  console.log('[02] fixation:', fx.maxLevel, 'relations maxLevel:', rel.maxLevel)

  const dims = await api.v1.sketch.dimension([
    { id: skId, name: 'R_tl', type: 'RADIUS', geomIds: [tl], value: 10 },
    { id: skId, name: 'R_bl', type: 'RADIUS', geomIds: [bl], value: 10 },
    { id: skId, name: 'width120', type: 'HORIZONTAL_DISTANCE', geomIds: [P.left.startId, P.bottom.endId], value: 120 },
    { id: skId, name: 'height80', type: 'VERTICAL_DISTANCE', geomIds: [right], value: 80 },
  ])
  console.log('[02] dims maxLevel:', dims.maxLevel, 'ids:', JSON.stringify(dims.result))

  // readback vs exact targets
  const targets = {
    'bottom.start (10,0)': [P.bottom.startId, 10, 0],
    'bottom.end (120,0)': [P.bottom.endId, 120, 0],
    'right.end (120,80)': [P.right.endId, 120, 80],
    'top.end (10,80)': [P.top.endId, 10, 80],
    'left.start (0,70)': [P.left.startId, 0, 70],
    'left.end (0,10)': [P.left.endId, 0, 10],
    'tl.center (10,70)': [P.tl.centerId, 10, 70],
    'bl.center (10,10)': [P.bl.centerId, 10, 10],
  }
  let pass = 0, total = 0
  const readout = {}
  for (const [label, [pid, tx, ty]] of Object.entries(targets)) {
    const p = (await api.v1.sketch.getPositions({ id: pid })).result.pos
    const ok = Math.abs(p.x - tx) < 1e-6 && Math.abs(p.y - ty) < 1e-6
    total++; if (ok) pass++
    readout[label] = [p.x, p.y, ok]
    console.log(`[02] ${ok ? '✓' : '❌'} ${label} → (${p.x.toFixed(9)}, ${p.y.toFixed(9)})`)
  }
  console.log('[02] solved-coordinate checks:', pass, '/', total)

  const ext = await api.v1.part.extrusion({
    id: partId, name: 'Block', references: [bottom, right, top, left, tl, bl], type: 'UP', limit2: 35,
  })
  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  const expVol = (9600 - 2 * (100 - 25 * Math.PI)) * 35
  console.log('[02] extrusion maxLevel:', ext.maxLevel, 'vol:', mp.volume.toFixed(2), 'expected:', expVol.toFixed(2), 'delta%:', (100 * (mp.volume - expVol) / expVol).toFixed(4))

  filewrite({ readout, pass, total, vol: mp.volume, expVol }, 'block-verify')
  await snapshot('02-block-sketch')
  return { pass, total }
}
